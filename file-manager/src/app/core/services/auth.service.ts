import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_BASE = `${environment.apiUrl}/auth`;
    private readonly CURRENT_USER_KEY = 'current-user';

    private http = inject(HttpClient);
    private router = inject(Router);

    private currentUserSig = signal<User | null>(null);
    readonly currentUser = this.currentUserSig.asReadonly();

    constructor() {
        const stored = localStorage.getItem(this.CURRENT_USER_KEY);
        if (stored) {
            this.currentUserSig.set(JSON.parse(stored));
        }
    }

    login(username: string, password: string): Observable<boolean> {
        return this.http.post<any>(`${this.API_BASE}/login.php`, { username, password }).pipe(
            tap(response => {
                const user: User = {
                    id: response.Id.toString(),
                    name: response.Username,
                    email: response.Username,
                    role: response.Role.toLowerCase() as 'admin' | 'user'
                };
                this.currentUserSig.set(user);
                localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
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

    getUsers(): Observable<User[]> {
        return this.http.get<any[]>(`${this.API_BASE}/users.php`).pipe(
            map(apiUsers => apiUsers.map(u => ({
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                role: u.role.toLowerCase() as 'admin' | 'user'
            }))),
            catchError(() => of([]))
        );
    }

    register(user: User): Observable<boolean> {
        // user object has name, email, password, role
        return this.http.post<any>(`${this.API_BASE}/register.php`, {
            name: user.name,
            password: user.password,
            role: user.role
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
            password: user.password
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

    logout() {
        this.currentUserSig.set(null);
        localStorage.removeItem(this.CURRENT_USER_KEY);
        this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        return !!this.currentUserSig();
    }

    isAdmin(): boolean {
        return this.currentUserSig()?.role === 'admin';
    }
}
