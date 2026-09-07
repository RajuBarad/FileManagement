import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { Observable, of, throwError, interval, Subscription } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_BASE = `${environment.apiUrl}/auth`;
    private readonly CURRENT_USER_KEY = 'current-user';
    private readonly LOGOUT_EVENT_KEY = 'auth_logout_timestamp';

    private http = inject(HttpClient);
    private router = inject(Router);
    private toast = inject(ToastService);

    private currentUserSig = signal<User | null>(null);
    readonly currentUser = this.currentUserSig.asReadonly();

    private broadcastChannel: BroadcastChannel | null = null;
    private heartbeatSub: Subscription | null = null;
    private isLoggingOut = false;

    constructor() {
        const stored = localStorage.getItem(this.CURRENT_USER_KEY);
        if (stored) {
            try {
                this.currentUserSig.set(JSON.parse(stored));
            } catch (e) {
                localStorage.removeItem(this.CURRENT_USER_KEY);
            }
        }

        // Initialize Cross-Tab Sync via BroadcastChannel if supported
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.broadcastChannel = new BroadcastChannel('file_manager_auth_channel');
                this.broadcastChannel.onmessage = (event) => {
                    if (event.data?.type === 'FORCE_LOGOUT') {
                        this.forceLogout(event.data?.reason || 'You have been logged out.', true);
                    }
                };
            } catch (e) {
                console.warn('BroadcastChannel not supported or failed', e);
            }
        }

        // Cross-tab fallback via storage event
        window.addEventListener('storage', (event) => {
            if (event.key === this.CURRENT_USER_KEY && !event.newValue && this.currentUserSig()) {
                this.forceLogout('You have been logged out in another tab.', true);
            } else if (event.key === this.LOGOUT_EVENT_KEY && this.currentUserSig()) {
                this.forceLogout('Session ended in another tab.', true);
            }
        });

        // Window focus / visibility change session check
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && this.isAuthenticated()) {
                    this.validateSession().subscribe();
                }
            });
        }

        // Start Periodic Heartbeat (every 15 seconds)
        this.startHeartbeat();
    }

    private startHeartbeat() {
        if (this.heartbeatSub) {
            this.heartbeatSub.unsubscribe();
        }

        this.heartbeatSub = interval(15000).subscribe(() => {
            if (this.isAuthenticated() && !this.isLoggingOut) {
                this.validateSession().subscribe();
            }
        });
    }

    login(username: string, password: string): Observable<boolean> {
        return this.http.post<any>(`${this.API_BASE}/login.php`, { username, password }).pipe(
            tap(response => {
                const user: User = {
                    id: response.Id.toString(),
                    name: response.Username,
                    email: response.Username,
                    role: response.Role.toLowerCase() as 'admin' | 'user',
                    token: response.Token || ''
                };
                this.currentUserSig.set(user);
                localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
                this.isLoggingOut = false;
                this.router.navigate(['/files']);
            }),
            map(() => true),
            catchError(error => {
                console.error('Login failed', error);
                const msg = error.error?.message || 'Login failed';
                return throwError(() => new Error(msg));
            })
        );
    }

    validateSession(): Observable<boolean> {
        const user = this.currentUserSig();
        if (!user || !user.token) {
            return of(false);
        }

        return this.http.post<any>(`${this.API_BASE}/validate_session.php`, {
            userId: user.id,
            token: user.token
        }).pipe(
            map(res => !!res?.valid),
            catchError(error => {
                if (error.status === 401 || error.status === 403) {
                    const message = error.error?.message || 'Your session has expired or password was changed. Please log in again.';
                    this.forceLogout(message);
                }
                return of(false);
            })
        );
    }

    changePassword(currentPassword: string, newPassword: string): Observable<any> {
        const user = this.currentUserSig();
        if (!user) {
            return throwError(() => new Error('User not logged in'));
        }

        return this.http.post<any>(`${this.API_BASE}/change_password.php`, {
            userId: user.id,
            currentPassword,
            newPassword
        });
    }

    getUsers(): Observable<User[]> {
        return this.http.get<any[]>(`${this.API_BASE}/users.php`).pipe(
            map(apiUsers => apiUsers.map(u => ({
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                role: u.role.toLowerCase() as 'admin' | 'user',
                parentUserId: u.parentUserId ? u.parentUserId.toString() : null,
                parentName: u.parentName || null
            }))),
            catchError(() => of([]))
        );
    }

    register(user: Omit<User, 'id'>): Observable<boolean> {
        return this.http.post<any>(`${this.API_BASE}/register.php`, {
            name: user.name,
            password: user.password,
            role: user.role,
            parentUserId: user.parentUserId || null
        }).pipe(
            map(() => true),
            catchError(err => throwError(() => new Error(err.error?.message || 'Registration failed')))
        );
    }

    updateUser(user: Partial<User> & { id: string }): Observable<boolean> {
        return this.http.post<any>(`${this.API_BASE}/update_user.php`, {
            id: user.id,
            name: user.name,
            role: user.role,
            password: user.password,
            parentUserId: user.parentUserId !== undefined ? user.parentUserId : null
        }).pipe(
            map(() => true),
            catchError(err => throwError(() => new Error(err.error?.message || 'Update failed')))
        );
    }

    deleteUser(id: string): Observable<boolean> {
        return this.http.post<any>(`${this.API_BASE}/delete_user.php`, { id }).pipe(
            map(() => true),
            catchError(err => throwError(() => new Error(err.error?.message || 'Delete failed')))
        );
    }

    forceLogout(reason?: string, skipBroadcast = false) {
        if (this.isLoggingOut) return;
        this.isLoggingOut = true;

        if (!skipBroadcast) {
            try {
                this.broadcastChannel?.postMessage({ type: 'FORCE_LOGOUT', reason });
                localStorage.setItem(this.LOGOUT_EVENT_KEY, Date.now().toString());
            } catch (e) {
                // ignore
            }
        }

        this.currentUserSig.set(null);
        localStorage.removeItem(this.CURRENT_USER_KEY);

        if (reason) {
            this.toast.show(reason, 'warning', 5000);
        }

        this.router.navigate(['/login']);
        setTimeout(() => {
            this.isLoggingOut = false;
        }, 1000);
    }

    logout() {
        this.forceLogout('You have been signed out.');
    }

    isAuthenticated(): boolean {
        return !!this.currentUserSig();
    }

    isAdmin(): boolean {
        return this.currentUserSig()?.role === 'admin';
    }
}
