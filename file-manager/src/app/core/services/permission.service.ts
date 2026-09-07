import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ModulePermission, UserPermissionsResponse, MyPermissionsResponse, PermissionAction } from '../models/permission.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_BASE = `${environment.apiUrl}/permissions`;
  private readonly PERMISSIONS_STORAGE_KEY = 'user_module_permissions';

  // Reactive signal holding dictionary of module rights and granular operations
  permissionsMap = signal<Record<string, Record<string, boolean>>>({});
  isLoaded = signal<boolean>(false);

  constructor() {
    const cached = localStorage.getItem(this.PERMISSIONS_STORAGE_KEY);
    if (cached) {
      try {
        this.permissionsMap.set(JSON.parse(cached));
        this.isLoaded.set(true);
      } catch (e) {
        localStorage.removeItem(this.PERMISSIONS_STORAGE_KEY);
      }
    }
  }

  loadMyPermissions(): Observable<MyPermissionsResponse | null> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.clearPermissions();
      return of(null);
    }

    return this.http.get<MyPermissionsResponse>(`${this.API_BASE}/my_permissions.php`).pipe(
      tap(res => {
        if (res && res.permissions) {
          this.permissionsMap.set(res.permissions);
          this.isLoaded.set(true);
          localStorage.setItem(this.PERMISSIONS_STORAGE_KEY, JSON.stringify(res.permissions));
        }
      }),
      catchError(err => {
        console.error('Failed to load user permissions:', err);
        return of(null);
      })
    );
  }

  clearPermissions() {
    this.permissionsMap.set({});
    this.isLoaded.set(false);
    localStorage.removeItem(this.PERMISSIONS_STORAGE_KEY);
  }

  /**
   * Primary method to check granular permission for any operation in any module.
   * e.g., can('tasks', 'split'), can('tasks', 'comment'), can('files', 'share'), etc.
   */
  can(moduleKey: string, operationKey: string): boolean {
    // Admin always has all permissions
    if (this.authService.isAdmin()) {
      return true;
    }

    const map = this.permissionsMap();
    const mod = map[moduleKey];
    if (!mod) {
      // Default fallback for core modules before initial custom config
      if (['files', 'tasks', 'followups'].includes(moduleKey)) {
        return true;
      }
      return false;
    }

    // Direct operation check
    if (typeof mod[operationKey] === 'boolean') {
      return mod[operationKey];
    }

    // Standard column fallbacks
    switch (operationKey) {
      case 'view': return !!(mod['canView'] ?? mod['view']);
      case 'add': 
      case 'upload': return !!(mod['canAdd'] ?? mod['add'] ?? mod['upload']);
      case 'edit':
      case 'update':
      case 'rename': return !!(mod['canUpdate'] ?? mod['edit'] ?? mod['update'] ?? mod['rename']);
      case 'delete': return !!(mod['canDelete'] ?? mod['delete']);
      default: return false;
    }
  }

  hasPermission(moduleKey: string, action: PermissionAction): boolean {
    return this.can(moduleKey, action);
  }

  canView(moduleKey: string): boolean {
    return this.can(moduleKey, 'view');
  }

  canAdd(moduleKey: string): boolean {
    return this.can(moduleKey, 'add') || this.can(moduleKey, 'upload');
  }

  canUpdate(moduleKey: string): boolean {
    return this.can(moduleKey, 'edit') || this.can(moduleKey, 'update') || this.can(moduleKey, 'rename');
  }

  canDelete(moduleKey: string): boolean {
    return this.can(moduleKey, 'delete');
  }

  // Specialized helpers for Task operations
  canSplit(moduleKey: string = 'tasks'): boolean {
    return this.can(moduleKey, 'split');
  }

  canComment(moduleKey: string = 'tasks'): boolean {
    return this.can(moduleKey, 'comment');
  }

  canMove(moduleKey: string = 'tasks'): boolean {
    return this.can(moduleKey, 'move');
  }

  // Specialized helpers for File operations
  canShare(moduleKey: string = 'files'): boolean {
    return this.can(moduleKey, 'share');
  }

  canDownload(moduleKey: string = 'files'): boolean {
    return this.can(moduleKey, 'download');
  }

  canStar(moduleKey: string = 'files'): boolean {
    return this.can(moduleKey, 'star');
  }

  canUpload(moduleKey: string = 'files'): boolean {
    return this.can(moduleKey, 'upload') || this.can(moduleKey, 'add');
  }

  hasAnyMasterPermission(): boolean {
    if (this.authService.isAdmin()) {
      return true;
    }

    const map = this.permissionsMap();
    const masterKeys = [
      'master_country', 'master_state', 'master_district', 'master_taluka', 'master_village',
      'master_channel', 'master_followup', 'master_scope_of_work', 'master_client', 'master_application'
    ];

    return masterKeys.some(k => map[k]?.['canView'] ?? map[k]?.['view']);
  }

  getUserPermissions(userId: string | number): Observable<UserPermissionsResponse> {
    return this.http.get<UserPermissionsResponse>(`${this.API_BASE}/get.php?userId=${userId}`);
  }

  saveUserPermissions(userId: string | number, permissions: ModulePermission[]): Observable<any> {
    return this.http.post<any>(`${this.API_BASE}/save.php`, {
      userId,
      permissions
    });
  }
}
