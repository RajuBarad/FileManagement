import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';
import { interval, switchMap, filter, of } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface Notification {
    id: number | string;
    message: string;
    type: 'Info' | 'UnlockAlert' | 'Share' | 'FileShare' | 'FolderShare' | 'PendingUnlockRequest' | 'TaskAssignment';
    relatedId: string | null;
    createdAt: any;
    isRead?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private toast = inject(ToastService);
    private readonly API_BASE = `${environment.apiUrl}/notifications`;

    notifications = signal<Notification[]>([]);
    unreadCount = signal(0);

    constructor() {
        // Request permissions for native notifications
        if (Capacitor.isNativePlatform()) {
            LocalNotifications.requestPermissions();
        }

        // Start polling when user is logged in
        // Simple polling every 30 seconds
        interval(30000).pipe(
            filter(() => !!this.auth.currentUser()),
            switchMap(() => this.fetchNotifications())
        ).subscribe();

        // Initial fetch
        effect(() => {
            if (this.auth.currentUser()) {
                this.fetchNotifications().subscribe();
            }
        });
    }

    fetchNotifications() {
        const user = this.auth.currentUser();
        if (!user) return of([]);

        return this.http.get<Notification[]>(`${this.API_BASE}/get_notifications.php?userId=${user.id}`).pipe(
            filter(notes => {
                // Check if we have new ones to show toast/notification?
                // Simple logic: if count increases? 
                // Ideally fetching only unread.
                const currentIds = new Set(this.notifications().map(n => n.id));
                notes.forEach(async n => {
                    if (!currentIds.has(n.id)) {
                        // New notification!
                        if (n.type === 'UnlockAlert') {
                            this.toast.show(n.message, 'info');
                        }

                        // Native Notification Check
                        if (Capacitor.isNativePlatform()) {
                            // Schedule a local notification
                            await LocalNotifications.schedule({
                                notifications: [{
                                    title: n.type === 'TaskAssignment' ? 'New Task Assigned' : 'Bharat Vasoya & Associates',
                                    body: n.message,
                                    id: typeof n.id === 'number' ? n.id : Math.floor(Math.random() * 100000), // Ensure int ID
                                    schedule: { at: new Date(Date.now() + 100) }, // Immediate
                                    sound: undefined,
                                    attachments: undefined,
                                    actionTypeId: '',
                                    extra: null
                                }]
                            });
                        }
                    }
                });
                return true;
            }),
            filter(notes => {
                this.notifications.set(notes);
                this.unreadCount.set(notes.length);
                return true;
            })
        );
    }


    requestUnlockNotification(fileId: string) {
        const user = this.auth.currentUser();
        if (!user) return;
        return this.http.post<any>(`${this.API_BASE}/request_unlock.php`, { fileId, userId: user.id });
    }

    markAsRead(notificationId: number | string) {
        const user = this.auth.currentUser();
        if (!user) return;

        this.http.post<any>(`${this.API_BASE}/mark_read.php`, { notificationId, userId: user.id }).subscribe(() => {
            // Optimistically update
            this.notifications.update(notes => notes.filter(n => n.id !== notificationId));
            this.unreadCount.update(c => Math.max(0, c - 1));
        });
    }
}
