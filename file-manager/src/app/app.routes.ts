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
            {
                path: 'user-history',
                loadComponent: () => import('./features/user-history/user-history.component').then(m => m.UserHistoryComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'history' }
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
                loadComponent: () => import('./features/tasks/task-dashboard.component').then(m => m.TaskDashboardComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'tasks' }
            },
            {
                path: 'followups',
                loadComponent: () => import('./features/followup-dashboard/followup-dashboard.component').then(m => m.FollowupDashboardComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'followups' }
            },
            {
                path: 'shared',
                loadComponent: () => import('./features/file-manager/file-manager.component').then(m => m.FileManagerComponent)
            },
            {
                path: 'masters/country',
                loadComponent: () => import('./features/masters/country/country-list.component').then(m => m.CountryListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_country' }
            },
            {
                path: 'masters/state',
                loadComponent: () => import('./features/masters/state/state-list.component').then(m => m.StateListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_state' }
            },
            {
                path: 'masters/district',
                loadComponent: () => import('./features/masters/district/district-list.component').then(m => m.DistrictListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_district' }
            },
            {
                path: 'masters/taluka',
                loadComponent: () => import('./features/masters/taluka/taluka-list.component').then(m => m.TalukaListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_taluka' }
            },
            {
                path: 'masters/village',
                loadComponent: () => import('./features/masters/village/village-list.component').then(m => m.VillageListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_village' }
            },
            {
                path: 'masters/channel',
                loadComponent: () => import('./features/masters/channel/channel-list.component').then(m => m.ChannelListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_channel' }
            },
            {
                path: 'masters/followup',
                loadComponent: () => import('./features/masters/followup/followup-list.component').then(m => m.FollowupListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_followup' }
            },
            {
                path: 'masters/scope-of-work',
                loadComponent: () => import('./features/masters/scope-of-work/scope-of-work-list.component').then(m => m.ScopeOfWorkListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_scope_of_work' }
            },
            {
                path: 'masters/client',
                loadComponent: () => import('./features/masters/client/client-list.component').then(m => m.ClientListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_client' }
            },
            {
                path: 'masters/application',
                loadComponent: () => import('./features/masters/application/application-list.component').then(m => m.ApplicationListComponent),
                canActivate: [() => import('./core/guards/permission.guard').then(m => m.permissionGuard)],
                data: { moduleKey: 'master_application' }
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
