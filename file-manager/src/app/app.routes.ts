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
            },
            {
                path: 'masters/country',
                loadComponent: () => import('./features/masters/country/country-list.component').then(m => m.CountryListComponent)
            },
            {
                path: 'masters/state',
                loadComponent: () => import('./features/masters/state/state-list.component').then(m => m.StateListComponent)
            },
            {
                path: 'masters/district',
                loadComponent: () => import('./features/masters/district/district-list.component').then(m => m.DistrictListComponent)
            },
            {
                path: 'masters/taluka',
                loadComponent: () => import('./features/masters/taluka/taluka-list.component').then(m => m.TalukaListComponent)
            },
            {
                path: 'masters/village',
                loadComponent: () => import('./features/masters/village/village-list.component').then(m => m.VillageListComponent)
            },
            {
                path: 'masters/channel',
                loadComponent: () => import('./features/masters/channel/channel-list.component').then(m => m.ChannelListComponent)
            },
            {
                path: 'masters/scope-of-work',
                loadComponent: () => import('./features/masters/scope-of-work/scope-of-work-list.component').then(m => m.ScopeOfWorkListComponent)
            },
            {
                path: 'masters/client',
                loadComponent: () => import('./features/masters/client/client-list.component').then(m => m.ClientListComponent)
            },
            {
                path: 'masters/application',
                loadComponent: () => import('./features/masters/application/application-list.component').then(m => m.ApplicationListComponent)
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
