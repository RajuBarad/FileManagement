import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, switchMap, filter, tap } from 'rxjs';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_BASE = `${environment.apiUrl}/notifications`;

    unreadCount = signal(0);
    notifications = signal<any[]>([]);
    private audio = new Audio('assets/notification.mp3'); // Ensure this file exists or use a CDN

    constructor() {
        // Request permission on init
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    startPolling() {
        // Poll every 10 seconds
        interval(10000).pipe(
            filter(() => !!this.authService.currentUser()), // Only if logged in
            switchMap(() => this.http.get<any>(`${this.API_BASE}/check.php?userId=${this.authService.currentUser()?.id}`))
        ).subscribe(res => {
            const count = res.unreadCount;
            const newNotifications = res.notifications || [];

            if (count > this.unreadCount()) {
                // New notification detected!
                this.playAlert();

                // Show latest
                const latest = newNotifications[0];
                if (latest) {
                    this.showDesktopNotification(latest.title, latest.message);
                    this.showInAppPopup(latest);
                }
            }
            this.unreadCount.set(count);
            this.notifications.set(newNotifications);
        });
    }

    private playAlert() {
        // Simple beep or load a file
        // Placeholder for now, won't crash if file missing but won't play
        try { this.audio.play(); } catch (e) { }
    }

    private showDesktopNotification(title: string, body: string) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
    }

    private showInAppPopup(notification: any) {
        Swal.fire({
            title: notification.title,
            text: notification.message,
            icon: 'info',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        // Mark as read immediately when shown? Or let user click?
        // Let's mark as read for now to prevent loop if count implies unread. 
        // Logic: if unreadCount > prevUnreadCount -> Valid new.
        // We update signal.
        // We should mark as read so next poll doesn't re-trigger if we base on count change.
        // Actually, poll returns unreadCount. If we don't mark read, count stays high.
        // But logic is: if current_count > previous_count -> Notify.
        // So validation holds.
        // Mark read logic should be explicit user action usually, but for "Toast", maybe auto-mark?
        // Let's call markAsRead API for this specific ID to avoid spamming.
        // REMOVED: this.markAsRead([notification.id]);
    }

    markAsRead(ids: any[]) {
        // Optimistic update
        this.notifications.update(current => current.filter(n => !ids.includes(n.id)));
        this.unreadCount.update(c => Math.max(0, c - ids.length));

        this.http.post(`${this.API_BASE}/mark_read.php`, { notificationIds: ids }).subscribe();
    }
}
