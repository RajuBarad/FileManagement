import { Injectable, signal, inject, OnDestroy, effect, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './auth.service';
import { Peer, DataConnection } from 'peerjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { User } from '../models/user.model';
import { ToastService } from './toast.service';

export interface ChatMessage {
  from: string;
  fromName: string;
  text?: string;
  file?: {
    name: string;
    size: number;
    type: string;
    blob: Blob | ArrayBuffer;
  };
  timestamp: number;
  isMe: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private zone = inject(NgZone);
  
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  
  private messagesSubject = new Subject<ChatMessage>();
  readonly messages$ = this.messagesSubject.asObservable();
  
  private historyMap = new Map<string, ChatMessage[]>();
  private historySubject = new BehaviorSubject<Map<string, ChatMessage[]>>(new Map());
  readonly history$ = this.historySubject.asObservable();

  private openChatsSubject = new BehaviorSubject<User[]>([]);
  readonly openChats$ = this.openChatsSubject.asObservable();
  
  minimizedChats = signal<Set<string>>(new Set());
  unreadCounts = signal<Map<string, number>>(new Map());

  private onlineUsersSubject = new BehaviorSubject<string[]>([]);
  readonly onlineUsers$ = this.onlineUsersSubject.asObservable();

  private activePeerIdSubject = new BehaviorSubject<string | null>(null);
  readonly activePeerId$ = this.activePeerIdSubject.asObservable();

  private readonly FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

  private titleService = inject(Title);
  private originalTitle = '';
  private globalUnreadCount = 0;
  private lastSenderName = '';

  constructor() {
    this.originalTitle = this.titleService.getTitle() || 'BVA Drive';

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.globalUnreadCount = 0;
        this.updateTitle();
      }
    });

    effect(() => {
      this.unreadCounts();
      this.zone.runOutsideAngular(() => {
          setTimeout(() => this.updateTitle(), 0);
      });
    });

    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
          this.initPeer(user);
      } else {
          this.destroyPeer();
      }
    });
  }

  private updateTitle() {
    let count = this.globalUnreadCount;
    this.unreadCounts().forEach(c => count += c);
    
    if (count > 0) {
      const senderText = this.lastSenderName ? `${this.lastSenderName} sent a message!` : 'New message!';
      this.titleService.setTitle(`(${count}) ${senderText}`);
    } else {
      this.lastSenderName = '';
      this.titleService.setTitle(this.originalTitle);
    }
  }

  private initPeer(user: User) {
    const peerId = `vba-drive-user-${user.id}`;
    if (this.peer && this.peer.id === peerId) return;

    this.destroyPeer();
    this.peer = new Peer(peerId);

    this.peer.on('open', (id) => {
      this.zone.run(() => {
        console.log('[ChatService] Peer opened:', id);
      });
    });

    this.peer.on('connection', (conn) => {
      this.zone.run(() => {
        this.setupConnection(conn);
      });
    });

    this.peer.on('error', (err) => {
      this.zone.run(() => {
        console.error('[ChatService] Peer error:', err);
        if (err.type === 'peer-unavailable') {
            this.toast.show('User is offline');
        }
      });
    });

    this.peer.on('disconnected', () => {
      this.zone.run(() => {
        this.peer?.reconnect();
      });
    });
  }

  private destroyPeer() {
    this.connections.forEach(conn => conn.close());
    this.connections.clear();
    this.updateOnlineUsers();
    this.openChatsSubject.next([]);
    this.minimizedChats.set(new Set());
    this.unreadCounts.set(new Map());
    this.historyMap.clear();
    this.historySubject.next(new Map());
    
    if (this.peer) {
        this.peer.destroy();
        this.peer = null;
    }
  }

  private setupConnection(conn: DataConnection) {
    conn.on('data', (data: any) => {
      this.zone.run(() => {
        this.handleIncomingData(conn.peer, data);
      });
    });

    conn.on('open', () => {
      this.zone.run(() => {
        this.connections.set(conn.peer, conn);
        this.updateOnlineUsers();
      });
    });

    conn.on('close', () => {
      this.zone.run(() => {
        this.connections.delete(conn.peer);
        this.updateOnlineUsers();
      });
    });

    conn.on('error', (err) => {
      this.zone.run(() => {
        this.connections.delete(conn.peer);
        this.updateOnlineUsers();
      });
    });
  }

  private audioCtx: any;

  private playNotificationSound() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = this.audioCtx.currentTime;
      playTone(600, now, 0.15);      
      playTone(800, now + 0.1, 0.25); 
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  private handleIncomingData(peerId: string, data: any) {
    this.lastSenderName = data.fromName || 'Someone';
    
    const msg: ChatMessage = {
      from: peerId,
      fromName: data.fromName || 'Unknown',
      text: data.type === 'text' ? data.content : undefined,
      file: data.type === 'file' ? {
        name: data.fileName,
        size: data.fileSize,
        type: data.fileType,
        blob: data.content 
      } : undefined,
      timestamp: Date.now(),
      isMe: false
    };
    
    this.addToHistory(peerId, msg);
    this.messagesSubject.next(msg);
    
    // Auto-open chat card if not already open
    this.ensureChatOpenByPeerId(peerId, data.fromName);
    
    // Play incoming message sound
    this.playNotificationSound();
  }

  private addToHistory(peerId: string, msg: ChatMessage) {
    const history = this.historyMap.get(peerId) || [];
    this.historyMap.set(peerId, [...history, msg]);
    this.historySubject.next(new Map(this.historyMap));
  }

  private updateOnlineUsers() {
    this.onlineUsersSubject.next(Array.from(this.connections.keys()));
  }

  openChat(user: User) {
      const current = this.openChatsSubject.value;
      const userId = String(user.id);
      if (!current.find(u => String(u.id) === userId)) {
          this.openChatsSubject.next([...current, user]);
      }
      
      const peerId = `vba-drive-user-${userId}`;
      if (!this.connections.has(peerId)) {
          this.connectToPeer(peerId);
      }
      
      // If was minimized, maximize it
      const currentMinimized = this.minimizedChats();
      if (currentMinimized.has(userId)) {
          const next = new Set(currentMinimized);
          next.delete(userId);
          this.minimizedChats.set(next);
          
          const counts = new Map(this.unreadCounts());
          counts.delete(userId);
          this.unreadCounts.set(counts);
      }
  }

  private ensureChatOpenByPeerId(peerId: string, name?: string) {
    const userId = peerId.replace('vba-drive-user-', '');
    const idStr = String(userId);
    const current = this.openChatsSubject.value;
    
    if (!current.find(u => String(u.id) === idStr)) {
        const newUser: User = {
            id: userId,
            name: name || 'User ' + userId,
            email: '',
            role: 'user'
        };
        this.openChatsSubject.next([...current, newUser]);
    }
    
    // If it is minimized, keep it minimized and increment unread badge
    const minimized = this.minimizedChats();
    if (minimized.has(idStr)) {
        const counts = new Map(this.unreadCounts());
        counts.set(idStr, (counts.get(idStr) || 0) + 1);
        this.unreadCounts.set(counts);
    } else if (document.visibilityState === 'hidden') {
        this.globalUnreadCount++;
        this.updateTitle();
    }
    
    // Ensure return connection is established
    if (!this.connections.has(peerId)) {
        this.connectToPeer(peerId);
    }
  }

  closeChat(userId: string) {
      const current = this.openChatsSubject.value;
      const idStr = String(userId);
      this.openChatsSubject.next(current.filter(u => String(u.id) !== idStr));
      
      const currentMinimized = this.minimizedChats();
      if (currentMinimized.has(idStr)) {
          const next = new Set(currentMinimized);
          next.delete(idStr);
          this.minimizedChats.set(next);
      }
  }

  toggleMinimize(userId: string) {
    const current = this.minimizedChats();
    const next = new Set(current);
    if (next.has(userId)) {
        next.delete(userId);
        
        // Clear unread count when maximizing
        const counts = new Map(this.unreadCounts());
        counts.delete(userId);
        this.unreadCounts.set(counts);
    } else {
        next.add(userId);
    }
    this.minimizedChats.set(next);
  }

  private connectToPeer(peerId: string) {
    if (this.peer && !this.peer.destroyed) {
      const conn = this.peer.connect(peerId, { reliable: true });
      this.setupConnection(conn);
    }
  }

  sendMessage(userId: string, text: string) {
    const peerId = `vba-drive-user-${userId}`;
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      const payload = {
        type: 'text',
        content: text,
        fromName: this.auth.currentUser()?.name
      };
      conn.send(payload);
      
      const msg: ChatMessage = {
        from: 'me',
        fromName: 'Me',
        text: text,
        timestamp: Date.now(),
        isMe: true
      };
      this.addToHistory(peerId, msg);
      this.messagesSubject.next(msg);
    } else {
      this.toast.show('User not available');
    }
  }

  sendFile(userId: string, file: File) {
    if (file.size > this.FILE_SIZE_LIMIT) {
      this.toast.show('File size exceeds 50MB limit');
      return;
    }

    const peerId = `vba-drive-user-${userId}`;
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      const payload = {
          type: 'file',
          content: file,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fromName: this.auth.currentUser()?.name
      };
      conn.send(payload);

      const msg: ChatMessage = {
        from: 'me',
        fromName: 'Me',
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          blob: file
        },
        timestamp: Date.now(),
        isMe: true
      };
      this.addToHistory(peerId, msg);
      this.messagesSubject.next(msg);
    } else {
      this.toast.show('User not available');
    }
  }

  ngOnDestroy() {
    this.destroyPeer();
  }
}
