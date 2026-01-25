import { Component, inject, OnInit, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsModule } from '../../core/modules/icons.module';
import { AuthService } from '../../core/services/auth.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { FileSystemItem } from '../../core/models/file-system.model';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterModule, Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { FilePreviewService } from '../../core/services/file-preview.service';

import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IconsModule, RouterModule, ReactiveFormsModule],
  template: `
    <header class="flex items-center justify-between px-3 md:px-6 h-full gap-3">
        <!-- Mobile Menu Toggler -->
        <button (click)="layoutService.toggleSidebar()" class="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <lucide-icon name="menu" class="h-6 w-6"></lucide-icon>
        </button>

      <div class="flex-1 max-w-2xl">
        <div class="relative z-50">
          <lucide-icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"></lucide-icon>
          <input type="text" placeholder="Search in Drive" 
                 [formControl]="searchControl"
                 (focus)="onInputFocus()"
                 (blur)="onInputBlur()"
                 (keyup.enter)="onSearchEnter()"
                 class="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg pl-12 pr-4 py-2.5 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:bg-white dark:focus:bg-gray-800 transition outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 shadow-sm">
          
          <!-- Search Dropdown (Google Drive Style) -->
          <div *ngIf="showDropdown() && searchControl.value?.trim()" 
               class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto py-2 animate-in fade-in zoom-in-95 duration-100">
             
              <div *ngIf="isSearching()" class="px-4 py-3 flex items-center justify-center text-gray-500 dark:text-gray-400 gap-2">
                 <lucide-icon name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
                 <span class="text-sm">Searching...</span>
              </div>

               <div *ngIf="!isSearching()">
                   <!-- No Results -->
                   <div *ngIf="searchResults().length === 0" class="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                       No results found matching "{{ searchControl.value }}"
                   </div>

                   <!-- Results List -->
                   <div *ngIf="searchResults().length > 0">
                       <!-- Result Count (Debug/Info) -->
                       <div class="px-4 pb-2 border-b border-gray-100 dark:border-gray-700 mb-2 text-xs text-gray-500 dark:text-gray-400">
                           Found {{ searchResults().length }} results
                       </div>

                       @for (item of searchResults(); track item.id) {
                           <div (mousedown)="onResultClick(item)" class="flex items-center px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group border-b border-gray-700/10 dark:border-gray-700/50">
                               <!-- Icon -->
                               <div class="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mr-3">
                                   @if (item.type === 'folder') {
                                       <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                                   } @else {
                                       <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                   }
                               </div>
                               
                               <!-- Text (Using flex-col structure that worked in debug) -->
                               <div class="flex-1 min-w-0 flex flex-col">
                                   <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" [title]="item.name">{{ item.name }}</span>
                                   <span class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.ownerName || 'Me' }}</span>
                               </div>

                                 <!-- Action (Using SVG just in case Lucide arrow is also bad, though arrow was likely fine) -->
                               <div class="ml-2 opacity-0 group-hover:opacity-100 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                               </div>
                           </div>
                       }
               </div>
          </div>
        </div>
      </div>
    </div>
      
      <div class="flex items-center gap-4 ml-4">
        <div class="relative group">
          <button class="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative">
             <lucide-icon name="bell" class="h-5 w-5"></lucide-icon>
             <span *ngIf="notificationService.unreadCount() > 0" class="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
          </button>
          
          <!-- Notification Dropdown -->
          <div class="absolute right-0 top-full pt-2 w-80 hidden group-hover:block transition z-50">
             <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="px-4 py-2 border-b border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                   <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Notifications</span>
                   <span class="text-xs text-gray-500 dark:text-gray-400">{{ notificationService.unreadCount() }} New</span>
                </div>
                <div class="max-h-80 overflow-y-auto">
                   @if (notificationService.notifications().length === 0) {
                       <div class="p-4 text-center text-sm text-gray-500">No new notifications</div>
                   } @else {
                       @for (n of notificationService.notifications(); track n.id) {
                           <div (click)="handleNotificationClick(n)" class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0">
                               <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ getNotificationTitle(n) }}</p>
                               <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ n.message }}</p>
                               <p class="text-[10px] text-gray-400 mt-1">{{ n.createdAt | date:'short' }}</p>
                           </div>
                       }
                   }
                </div>
             </div>
          </div>
        </div>
        <button *ngIf="authService.isAdmin()" routerLink="/admin" class="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative tooltip-container">
          <lucide-icon name="settings" class="h-5 w-5"></lucide-icon>
        </button>
        
        <div class="relative group">
          <button class="flex items-center gap-2 focus:outline-none">
            <div class="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
              {{ getUserInitials() }}
            </div>
            <span class="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">{{ authService.currentUser()?.name }}</span>
            <lucide-icon name="chevron-down" class="h-4 w-4 text-gray-500"></lucide-icon>
          </button>
          
          <!-- Dropdown -->
          <div class="absolute right-0 top-full pt-2 w-48 hidden group-hover:block transition z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-100 dark:border-gray-700">
                <div class="px-4 py-2 border-b border-gray-50 dark:border-gray-700">
                   <p class="text-sm font-medium text-gray-900 dark:text-gray-200">{{ authService.currentUser()?.name }}</p>
                   <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authService.currentUser()?.email }}</p>
                </div>
                
                <a *ngIf="authService.isAdmin()" routerLink="/admin" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                   <lucide-icon name="shield" class="h-4 w-4"></lucide-icon>
                   Admin Dashboard
                </a>
    
                <button (click)="logout()" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2">
                   <lucide-icon name="log-out" class="h-4 w-4"></lucide-icon>
                   Sign out
                </button>
            </div>
          </div>
        </div>

      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  authService = inject(AuthService);
  fileService = inject(FileSystemService);
  notificationService = inject(NotificationService);
  previewService = inject(FilePreviewService);
  layoutService = inject(LayoutService);
  router = inject(Router);
  searchControl = new FormControl('');

  searchResults = signal<FileSystemItem[]>([]);
  showDropdown = signal(false);
  isSearching = signal(false);

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      const term = value?.trim() ?? '';
      if (term.length > 0) {
        this.isSearching.set(true);
        this.showDropdown.set(true);
        this.fileService.quickSearch(term, 8).subscribe(results => {
          console.log('Search Results:', results); // Debug
          this.searchResults.set(results);
          this.isSearching.set(false);
        });
      } else {
        this.searchResults.set([]);
        this.showDropdown.set(false);
        this.isSearching.set(false);
        // If cleared, maybe reset global? For now, onSearchEnter handles global reset
      }
    });
  }

  onInputFocus() {
    if (this.searchControl.value?.trim()) {
      this.showDropdown.set(true);
    }
  }

  onInputBlur() {
    // Small delay to allow click event to register
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  onSearchEnter() {
    const term = this.searchControl.value?.trim() ?? '';
    this.showDropdown.set(false); // Close dropdown
    if (term) {
      this.fileService.searchFiles(term, 1, 15).subscribe();
    } else {
      this.fileService.resetSearch();
      const currentFolder = this.fileService.currentFolderId();
      this.fileService.getItems(currentFolder).subscribe();
    }
  }

  onResultClick(item: FileSystemItem) {
    this.showDropdown.set(false);
    this.searchControl.setValue(item.name, { emitEvent: false }); // Optional: set text

    if (item.type === 'folder') {
      this.router.navigate(['/files', item.id]);
    } else {
      // Open preview using global service
      this.previewService.open(item);
    }
  }

  getNotificationTitle(n: any): string {
    switch (n.type) {
      case 'UnlockAlert': return 'File Unlocked';
      case 'PendingUnlockRequest': return 'Pending Request';
      case 'TaskAssignment': return 'New Task';
      case 'FolderShare': return 'Folder Shared';
      case 'FileShare': return 'File Shared';
      default: return 'Notification';
    }
  }

  handleNotificationClick(n: any) {
    this.notificationService.markAsRead(n.id);

    if (n.type === 'UnlockAlert' && n.relatedId) {
      // Logic to preview or go to folder?
      // Currently generic, let's leave it or implement similarly if needed
    } else if (n.type === 'PendingUnlockRequest') {
      if (n.parentId === 'shared') {
        this.router.navigate(['/shared']);
      } else if (n.parentId) {
        this.router.navigate(['/files', n.parentId]);
      } else {
        this.router.navigate(['/files']);
      }
    } else if (n.type === 'TaskAssignment' && n.referenceId) {
      this.router.navigate(['/tasks'], { queryParams: { openTaskId: n.referenceId, t: new Date().getTime() } });
    } else if (n.type === 'FolderShare' && n.referenceId) {
      this.router.navigate(['/files', n.referenceId]);
    } else if (n.type === 'FileShare') {
      this.router.navigate(['/files/shared']);
    }
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name || 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  logout() {
    this.authService.logout();
  }

  trackByFileId(index: number, item: FileSystemItem): string {
    return item.id;
  }

  getIconName(item: FileSystemItem): string {
    if (!item) return 'file';
    if (item.type === 'folder') return 'folder';
    // Add more extension mapping here if needed, but for now safe default
    return 'file';
  }
}
