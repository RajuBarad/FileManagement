import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconsModule } from '../../core/modules/icons.module';
import { ChatService, ChatMessage } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { User } from '../../core/models/user.model';
import { FormatSizePipe } from '../../core/pipes/format-size.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule, FormatSizePipe],
  template: `
    <!-- Floating Toggle Button (FAB) -->
    <button (click)="layout.toggleChat(); $event.stopPropagation()" 
            class="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-[110] transition-all duration-300 transform active:scale-90 group">
      <lucide-icon [name]="layout.isChatOpen() ? 'x' : 'message-square'" class="h-6 w-6"></lucide-icon>
      <div *ngIf="(chatService.onlineUsers$ | async)?.length && !layout.isChatOpen()" class="absolute -top-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
    </button>

    <!-- Floating User List Panel -->
    <div *ngIf="layout.isChatOpen()" 
         (click)="$event.stopPropagation()"
         class="fixed bottom-24 right-6 w-[320px] h-[500px] bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col z-[105] animate-in slide-in-from-bottom duration-300 overflow-hidden">
      
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-gray-900">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <lucide-icon name="message-square" class="h-6 w-6"></lucide-icon>
          </div>
          <h3 class="font-bold text-gray-800 dark:text-white">Messages</h3>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-1 bg-white dark:bg-gray-900">
        <div *ngFor="let user of users()" 
             (click)="chatService.openChat(user); layout.closeChat()"
             class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition group">
          <div class="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 relative">
            <lucide-icon name="user" class="h-5 w-5"></lucide-icon>
            <div *ngIf="isUserOnline(user.id)" class="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
          </div>
          <div class="flex-1 min-w-0">
            <span class="font-semibold text-sm text-gray-700 dark:text-gray-200 block truncate">{{ user.name }}</span>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider">{{ user.role }}</p>
          </div>
          <lucide-icon name="plus" class="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition"></lucide-icon>
        </div>

        <div *ngIf="users().length === 0" class="p-8 text-center opacity-30">
           <lucide-icon name="users" class="h-8 w-8 mx-auto mb-2"></lucide-icon>
           <p class="text-sm">No other users found</p>
        </div>
      </div>
    </div>

    <!-- Active Chat Cards Container -->
    <div class="fixed bottom-0 right-24 flex flex-row-reverse items-end gap-3 z-[101] pointer-events-none p-0 h-0 w-[calc(100%-120px)] justify-start pr-4">
      
      <div *ngFor="let user of chatService.openChats$ | async" 
           [ngClass]="isMinimized(user.id) ? 'h-14 overflow-hidden' : 'h-[450px]'"
           class="w-[300px] bg-white dark:bg-gray-900 shadow-2xl rounded-t-xl border border-gray-200 dark:border-gray-800 flex flex-col pointer-events-auto animate-in slide-in-from-bottom duration-300 relative transition-all duration-300">
        
        <!-- Card Header -->
        <div class="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-gray-900 cursor-pointer rounded-t-xl"
             (click)="chatService.toggleMinimize(String(user.id))">
          <div class="flex items-center gap-2 min-w-0">
            <div class="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <lucide-icon name="user" class="h-4 w-4"></lucide-icon>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-sm text-gray-800 dark:text-white truncate">{{ user.name }}</h4>
                <div *ngIf="getUnreadCount(user.id) > 0" class="h-4 min-w-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow shadow-red-500/30">
                  {{ getUnreadCount(user.id) }}
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <div [ngClass]="isUserOnline(user.id) ? 'bg-green-500' : 'bg-gray-400'" class="h-1.5 w-1.5 rounded-full"></div>
                <span class="text-[9px] font-medium uppercase tracking-wider" [ngClass]="isUserOnline(user.id) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'">
                    {{ isUserOnline(user.id) ? 'Online' : 'Offline' }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0" (click)="$event.stopPropagation()">
            <button (click)="chatService.toggleMinimize(String(user.id))" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
              <lucide-icon [name]="isMinimized(user.id) ? 'maximize-2' : 'minus'" class="h-3.5 w-3.5"></lucide-icon>
            </button>
            <button (click)="chatService.closeChat(String(user.id))" class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
              <lucide-icon name="x" class="h-3.5 w-3.5"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Messages Container -->
        <div *ngIf="!isMinimized(user.id)" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 scroll-container" #scrollContainer>
          <div *ngFor="let msg of getHistory(user.id)" 
               [ngClass]="msg.isMe ? 'items-end' : 'items-start'" 
               class="flex flex-col">
            
            <div [ngClass]="msg.isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-blue-100 dark:shadow-none' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none shadow-sm'"
                 class="max-w-[85%] p-2.5 shadow-sm">
              
              <p *ngIf="msg.text" class="text-xs whitespace-pre-wrap leading-relaxed">{{ msg.text }}</p>
              
              <div *ngIf="msg.file" class="flex items-center gap-2 py-0.5">
                 <div class="h-8 w-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <lucide-icon name="file" class="h-4 w-4 opacity-70"></lucide-icon>
                 </div>
                 <div class="min-w-0 pr-1">
                    <p class="text-[11px] font-semibold truncate">{{ msg.file.name }}</p>
                    <p class="text-[9px] opacity-70">{{ msg.file.size | formatSize }}</p>
                 </div>
                 <button *ngIf="!msg.isMe" 
                         (click)="downloadFile(msg.file)"
                         class="h-7 w-7 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition shrink-0 bg-black/5 dark:bg-white/5">
                    <lucide-icon name="download" class="h-3.5 w-3.5"></lucide-icon>
                 </button>
              </div>
            </div>
            <span class="text-[9px] text-gray-400 mt-1 px-1 font-medium">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>
          
          <div *ngIf="getHistory(user.id).length === 0" class="flex flex-col items-center justify-center h-full space-y-2 py-10 opacity-30">
             <lucide-icon name="message-square" class="h-8 w-8"></lucide-icon>
             <p class="text-xs font-medium">No messages</p>
          </div>
        </div>

        <!-- Input Area -->
        <div *ngIf="!isMinimized(user.id)" class="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <div class="flex items-end gap-2">
            <div class="flex-1 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl px-2 py-1.5 flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
              <button (click)="fileInput.click()" 
                      class="h-7 w-7 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition shrink-0">
                <lucide-icon name="paperclip" class="h-4 w-4"></lucide-icon>
              </button>
              <textarea 
                [ngModel]="getMessageInput(String(user.id))"
                (ngModelChange)="setMessageInput(String(user.id), $event)"
                (keydown.enter)="handleEnter($event, String(user.id))"
                placeholder="Type..."
                class="bg-transparent border-none focus:ring-0 w-full text-xs text-gray-700 dark:text-gray-200 resize-none max-h-24 p-0 leading-relaxed py-1.5 overflow-y-auto"
                rows="1"
              ></textarea>
            </div>
            <button 
              (click)="sendMessage(String(user.id))"
              [disabled]="!getMessageInput(String(user.id)).trim()"
              class="h-9 w-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 transition shrink-0 active:scale-95">
              <lucide-icon name="send" class="h-4 w-4"></lucide-icon>
            </button>
          </div>
          <input #fileInput type="file" class="hidden" (change)="onFileSelected($event, String(user.id))">
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    textarea::placeholder { opacity: 0.6; }
    textarea:focus { outline: none; }
    .scroll-container::-webkit-scrollbar { width: 4px; }
    .scroll-container::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
    .dark .scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
  `]
})
export class ChatComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainers!: ElementRef[];

  public chatService = inject(ChatService);
  public auth = inject(AuthService);
  public layout = inject(LayoutService);
  private cdr = inject(ChangeDetectorRef);

  users = signal<User[]>([]);
  messageInputs = new Map<string, string>();
  history = new Map<string, ChatMessage[]>();
  private onlineUserIds = signal<Set<string>>(new Set());
  private subs = new Subscription();
  String = String; // Expose String to template

  constructor() {
    this.loadUsers();
    
    this.subs.add(this.chatService.history$.subscribe(hist => {
      this.history = hist;
      this.cdr.markForCheck();
    }));

    this.subs.add(this.chatService.onlineUsers$.subscribe(ids => {
        this.onlineUserIds.set(new Set(ids));
        this.cdr.markForCheck();
    }));

    this.subs.add(this.chatService.openChats$.subscribe(() => {
        this.cdr.markForCheck();
    }));
  }

  @HostListener('document:click')
  clickOutside() {
    if (this.layout.isChatOpen()) {
        this.layout.closeChat();
    }
  }

  isMinimized(userId: any): boolean {
    return this.chatService.minimizedChats().has(String(userId));
  }

  getUnreadCount(userId: any): number {
    return this.chatService.unreadCounts().get(String(userId)) || 0;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadUsers() {
    this.auth.getUsers().subscribe(users => {
      const currentUser = this.auth.currentUser();
      this.users.set(users.filter(u => u.id !== currentUser?.id));
    });
  }

  isUserOnline(userId: any): boolean {
      return this.onlineUserIds().has(`vba-drive-user-${userId}`);
  }

  getHistory(userId: any): ChatMessage[] {
    const peerId = `vba-drive-user-${userId}`;
    return this.history.get(peerId) || [];
  }

  getMessageInput(userId: string): string {
    return this.messageInputs.get(userId) || '';
  }

  setMessageInput(userId: string, val: string) {
    this.messageInputs.set(userId, val);
  }

  sendMessage(userId: string) {
    const text = this.getMessageInput(userId);
    if (text.trim()) {
        this.chatService.sendMessage(userId, text.trim());
        this.messageInputs.set(userId, '');
        this.cdr.detectChanges();
    }
  }

  handleEnter(event: any, userId: string) {
    if (!event.shiftKey) {
        event.preventDefault();
        this.sendMessage(userId);
    }
  }

  onFileSelected(event: any, userId: string) {
    const file = event.target.files[0];
    if (file) {
        this.chatService.sendFile(userId, file);
    }
    event.target.value = '';
  }

  downloadFile(file: any) {
    const blob = file.blob instanceof Blob ? file.blob : new Blob([file.blob], { type: file.type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private scrollToBottom(): void {
    const elements = document.querySelectorAll('.scroll-container');
    elements.forEach(el => {
        el.scrollTop = el.scrollHeight;
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
