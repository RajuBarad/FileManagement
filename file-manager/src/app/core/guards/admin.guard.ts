import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isAuthenticated() && auth.isAdmin()) {
        return true;
    }

    // Not admin? redirect to files
    if (auth.isAuthenticated()) {
        return router.createUrlTree(['/files']);
    }

    return router.createUrlTree(['/login']);
};
