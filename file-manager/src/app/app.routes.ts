import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'files',
                loadComponent: () => import('./features/file-manager/file-manager.component').then(m => m.FileManagerComponent)
            },
            {
                path: 'files/:folderId',
                loadComponent: () => import('./features/file-manager/file-manager.component').then(m => m.FileManagerComponent)
            },
            {
                path: 'file/:fileId',
                loadComponent: () => import('./features/editor/editor.component').then(m => m.EditorComponent)
            },
            {
                path: 'admin',
                loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
                canActivate: [() => import('./core/guards/admin.guard').then(m => m.adminGuard)]
            },
            // Placeholder routes for sidebar links
            {
                path: 'recent',
                loadComponent: () => import('./features/file-manager/file-manager.component').then(m => m.FileManagerComponent)
            },
            {
                path: 'starred',
                loadComponent: () => import('./features/file-manager/file-manager.component').then(m => m.FileManagerComponent)
            },
            {
                path: 'trash',
                loadComponent: () => import('./features/file-manager/file-manager.component').then(m => m.FileManagerComponent)
            },
            {
                path: 'tasks',
                loadComponent: () => import('./features/tasks/task-dashboard.component').then(m => m.TaskDashboardComponent)
            },
            {
                path: 'shared',
                loadComponent: () => import('./features/file-manager/file-manager.component').then(m => m.FileManagerComponent)
            }
        ]
    },
    {
        path: 'login',
        component: AuthLayoutComponent,
        children: [
            {
                path: '',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            }
        ]
    },
    { path: '**', redirectTo: 'dashboard' }
];
