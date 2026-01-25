import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { ToastContainerComponent } from '../../core/services/toast.service';
import { LayoutService } from '../../core/services/layout.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, ToastContainerComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      <!-- Mobile Backdrop -->
      <div *ngIf="layoutService.isMobileSidebarOpen()" 
           (click)="layoutService.closeSidebar()"
           class="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200">
      </div>

      <!-- Sidebar -->
      <!-- Added z-50 for mobile, absolute for mobile -->
      <app-sidebar class="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 
                          fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none"
                          [class.-translate-x-full]="!layoutService.isMobileSidebarOpen()"
                          [class.translate-x-0]="layoutService.isMobileSidebarOpen()"
                          [class.md:translate-x-0]="true">
      </app-sidebar>

      <div class="flex-1 flex flex-col min-w-0">
        <app-header class="h-16 flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 relative z-20"></app-header>
        <main class="flex-1 overflow-auto p-4 md:p-6 relative bg-gray-50 dark:bg-gray-900 z-10">
          <router-outlet></router-outlet>
          <app-toast-container></app-toast-container>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  layoutService = inject(LayoutService);
}
