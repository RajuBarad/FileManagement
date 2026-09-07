import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { IconsModule } from '../../core/modules/icons.module';

@Component({
  selector: 'app-create-folder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div *ngIf="isOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="close()"></div>

      <!-- Modal Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-800">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <lucide-icon name="folder-plus" class="h-5 w-5"></lucide-icon>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-white">Create New Folder</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">Add a folder to your workspace</p>
            </div>
          </div>
          <button (click)="close()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-5">
          <!-- Folder Name Input -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Folder Name <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input type="text" [(ngModel)]="folderName" (keyup.enter)="confirm()" placeholder="e.g. Finance Reports, Project Alpha"
                     class="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 dark:bg-gray-700/50 dark:text-white text-sm transition" autofocus>
              <lucide-icon name="folder" class="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"></lucide-icon>
            </div>
          </div>

          <!-- Admin Sharing Section (Visible only when current user is Admin) -->
          <div *ngIf="isAdmin()" class="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <lucide-icon name="users" class="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"></lucide-icon>
                  Share With Users
                </span>
                <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Other admin users are <span class="font-medium text-purple-600 dark:text-purple-400">selected by default</span>
                </p>
              </div>

              <!-- Quick Selection Buttons -->
              <div class="flex items-center gap-1.5 text-xs">
                <button type="button" (click)="selectAdminsOnly()" 
                        class="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium transition text-[11px]">
                  Admins Only
                </button>
                <button type="button" (click)="selectAll()" 
                        class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition text-[11px]">
                  All
                </button>
                <button type="button" (click)="clearAll()" 
                        class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition text-[11px]">
                  Clear
                </button>
              </div>
            </div>

            <!-- Search Users Filter -->
            <div class="relative">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Filter users by name..."
                     class="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <lucide-icon name="search" class="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"></lucide-icon>
            </div>

            <!-- Users Multi-select List -->
            <div class="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800/80 shadow-inner">
              <div *ngIf="filteredUsers().length === 0" class="p-4 text-center text-xs text-gray-400">
                No users found
              </div>

              <div *ngFor="let user of filteredUsers()" 
                   (click)="toggleUser(user.id)"
                   class="flex items-center justify-between px-3.5 py-2 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 cursor-pointer transition select-none">
                
                <div class="flex items-center gap-2.5 min-w-0">
                  <!-- Initials Avatar -->
                  <div class="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                       [ngClass]="user.role.toLowerCase() === 'admin' ? 'bg-gradient-to-tr from-purple-600 to-indigo-500' : 'bg-gradient-to-tr from-blue-500 to-cyan-500'">
                    {{ getUserInitials(user.name) }}
                  </div>
                  
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{{ user.name }}</span>
                      <span [ngClass]="user.role.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                            class="px-1.5 py-0.2 text-[9px] font-bold rounded-md">
                        {{ user.role.toLowerCase() === 'admin' ? 'Admin' : 'User' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-gray-400 truncate">{{ user.email }}</p>
                  </div>
                </div>

                <!-- Custom Checkbox -->
                <div class="h-5 w-5 rounded-md border flex items-center justify-center transition"
                     [ngClass]="selectedUserIds().has(user.id) ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'">
                  <lucide-icon *ngIf="selectedUserIds().has(user.id)" name="check" class="h-3.5 w-3.5 stroke-[3]"></lucide-icon>
                </div>
              </div>
            </div>

            <!-- Selected Summary -->
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <span>Selected: <strong class="text-gray-700 dark:text-gray-200">{{ selectedUserIds().size }}</strong> users</span>
              <span *ngIf="selectedUserIds().size > 0" class="text-blue-600 dark:text-blue-400 font-medium">Will be shared on create</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/40 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
          <button type="button" (click)="close()" 
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-600 rounded-xl transition">
            Cancel
          </button>
          <button type="button" (click)="confirm()" [disabled]="!folderName.trim()"
                  class="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <lucide-icon name="folder-plus" class="h-4 w-4"></lucide-icon>
            <span>{{ selectedUserIds().size > 0 ? 'Create & Share' : 'Create Folder' }}</span>
          </button>
        </div>

      </div>
    </div>
  `
})
export class CreateFolderModalComponent {
  private authService = inject(AuthService);

  @Output() onConfirm = new EventEmitter<{ name: string; sharedUserIds: string[] }>();
  @Output() onClose = new EventEmitter<void>();

  isOpen = signal<boolean>(false);
  folderName = '';
  searchQuery = '';
  users = signal<User[]>([]);
  selectedUserIds = signal<Set<string>>(new Set<string>());

  isAdmin = computed(() => this.authService.isAdmin());

  filteredUsers = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    const currentUid = this.authService.currentUser()?.id;
    return this.users().filter(u => {
      if (String(u.id) === String(currentUid)) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  });

  open() {
    this.folderName = '';
    this.searchQuery = '';
    this.isOpen.set(true);

    if (this.isAdmin()) {
      this.authService.getUsers().subscribe(allUsers => {
        this.users.set(allUsers);
        this.selectAdminsOnly();
      });
    }
  }

  close() {
    this.isOpen.set(false);
    this.folderName = '';
    this.searchQuery = '';
    this.selectedUserIds.set(new Set());
    this.onClose.emit();
  }

  toggleUser(userId: string) {
    this.selectedUserIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }

  selectAdminsOnly() {
    const currentUid = this.authService.currentUser()?.id;
    const adminSet = new Set<string>();
    this.users().forEach(u => {
      if (String(u.id) !== String(currentUid) && u.role?.toLowerCase() === 'admin') {
        adminSet.add(String(u.id));
      }
    });
    this.selectedUserIds.set(adminSet);
  }

  selectAll() {
    const currentUid = this.authService.currentUser()?.id;
    const allSet = new Set<string>();
    this.users().forEach(u => {
      if (String(u.id) !== String(currentUid)) {
        allSet.add(String(u.id));
      }
    });
    this.selectedUserIds.set(allSet);
  }

  clearAll() {
    this.selectedUserIds.set(new Set());
  }

  confirm() {
    if (!this.folderName.trim()) return;

    const payload = {
      name: this.folderName.trim(),
      sharedUserIds: Array.from(this.selectedUserIds())
    };

    this.onConfirm.emit(payload);
    this.close();
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
