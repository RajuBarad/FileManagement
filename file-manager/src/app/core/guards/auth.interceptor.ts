import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const currentUser = authService.currentUser();

    let authReq = req;
    if (currentUser?.token) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${currentUser.token}`,
                'X-Auth-Token': currentUser.token,
                'X-User-Id': currentUser.id
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // If 401 Unauthorized occurs on authenticated routes (and not login / change password verification)
            if (error.status === 401 && !req.url.includes('/login.php') && !req.url.includes('/change_password.php')) {
                if (authService.isAuthenticated()) {
                    authService.forceLogout('Your session has expired or your password was changed. Please log in again.');
                }
            }
            return throwError(() => error);
        })
    );
};
