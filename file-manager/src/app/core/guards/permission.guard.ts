import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { ToastService } from '../services/toast.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.isAdmin()) {
    return true;
  }

  const moduleKey = route.data?.['moduleKey'] as string;
  if (!moduleKey) {
    return true;
  }

  if (permissionService.canView(moduleKey)) {
    return true;
  }

  toast.show('Access Denied: You do not have permission to access this module.', 'error', 4000);
  return router.createUrlTree(['/files']);
};
