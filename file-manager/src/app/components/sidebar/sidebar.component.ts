import { Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LucideAngularModule, Cloud, Plus, Folder, Upload, FolderUp, FileText, FileSpreadsheet, HardDrive, Clock, Star, Trash2, Users } from 'lucide-angular';
import Swal from 'sweetalert2';
import { FileSystemService } from '../../core/services/file-system.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../modal/modal.component';

import { IconsModule } from '../../core/modules/icons.module';
import { FileUploaderService } from '../../core/services/file-uploader.service';
import { ThemeService } from '../../core/services/theme.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconsModule, ModalComponent],
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 relative transition-colors duration-300">
      <div class="p-6">
        <div class="flex items-center gap-2 mb-8">
           <lucide-icon name="cloud" class="h-8 w-8 text-blue-600"></lucide-icon>
          <span class="text-xl font-bold text-gray-800">BVA Drive</span>
        </div>
        
        <div class="relative">
          <button (click)="toggleNewMenu()" class="w-full bg-white text-gray-700 border border-gray-200 rounded-full py-3 px-4 flex items-center gap-3 hover:bg-gray-50 hover:shadow-md transition shadow-sm mb-2">
            <lucide-icon name="plus" class="h-6 w-6 text-blue-600"></lucide-icon>
            <span class="font-medium">New</span>
          </button>

          <!-- Dropdown -->
          <div *ngIf="showNewMenu()" class="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
            <button (click)="openNewFolderModal()" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-gray-700">
               <lucide-icon name="folder" class="h-4 w-4 text-gray-500"></lucide-icon>
               New Folder
            </button>
            <hr class="my-2 border-gray-100">
            <button (click)="fileInput.click()" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-gray-700">
               <lucide-icon name="upload" class="h-4 w-4 text-gray-500"></lucide-icon>
               File Upload
            </button>
            <button (click)="folderInput.click()" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 text-gray-700">
               <lucide-icon name="folder-up" class="h-4 w-4 text-gray-500"></lucide-icon>
               Folder Upload
            </button>

          </div>
        </div>

        <input #fileInput type="file" class="hidden" (change)="onFileSelected($event)">
        <input #folderInput type="file" class="hidden" webkitdirectory directory multiple (change)="onFolderSelected($event)">
      </div>
      
      <nav class="flex-1 px-4 space-y-1">
        <a routerLink="/files" routerLinkActive="bg-blue-50 text-blue-600" [routerLinkActiveOptions]="{exact: false}" 
           (click)="layoutService.closeSidebar()"
           class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
          <lucide-icon name="hard-drive" class="h-5 w-5"></lucide-icon>
          My Drive
        </a>
        <a routerLink="/shared" (click)="layoutService.closeSidebar()"
           class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
          <lucide-icon name="users" class="h-5 w-5"></lucide-icon>
          Shared with me
        </a>
        <a routerLink="/recent" (click)="layoutService.closeSidebar()"
           class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
          <lucide-icon name="clock" class="h-5 w-5"></lucide-icon>
          Recent
        </a>
        <a routerLink="/starred" (click)="layoutService.closeSidebar()"
           class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
          <lucide-icon name="star" class="h-5 w-5"></lucide-icon>
          Starred
        </a>
        <a routerLink="/trash" (click)="layoutService.closeSidebar()"
           class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
          <lucide-icon name="trash-2" class="h-5 w-5"></lucide-icon>
          Trash
        </a>
        <a routerLink="/tasks" (click)="layoutService.closeSidebar()"
           class="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition">
          <lucide-icon name="check-square" class="h-5 w-5"></lucide-icon>
          Tasks
        </a>
      </nav>
      
      <!-- Storage widget removed -->

      <!-- Theme Toggle -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800">
         <button (click)="themeService.toggle()" class="w-full flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <div class="flex items-center gap-3">
                <lucide-icon [name]="themeService.isDark() ? 'moon' : 'sun'" class="h-5 w-5"></lucide-icon>
                <span>{{ themeService.isDark() ? 'Dark Mode' : 'Light Mode' }}</span>
            </div>
            <div class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                 [ngClass]="themeService.isDark() ? 'bg-blue-600' : 'bg-gray-200'">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      [ngClass]="themeService.isDark() ? 'translate-x-6' : 'translate-x-1'"></span>
            </div>
         </button>
      </div>

      <app-modal #folderModal
         title="New Folder" 
         placeholder="Untitled folder"
         (onConfirm)="createFolder($event)">
      </app-modal>
    </div>
  `
})
export class SidebarComponent {
  private fileService = inject(FileSystemService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private uploader = inject(FileUploaderService);
  public themeService = inject(ThemeService);
  public layoutService = inject(LayoutService);

  @ViewChild('folderModal') folderModal!: ModalComponent;
  showNewMenu = signal(false);

  toggleNewMenu() {
    this.showNewMenu.update(v => !v);
  }

  openNewFolderModal() {
    this.showNewMenu.set(false);
    this.folderModal.open();
  }

  createFolder(name: string) {
    this.fileService.createFolder(this.fileService.currentFolderId(), name).subscribe(() => {
      this.toast.show('Folder created');
    });
  }



  onFileSelected(event: Event) {
    this.showNewMenu.set(false);
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploader.handleFileInput(Array.from(input.files));
      input.value = '';
    }
  }

  onFolderSelected(event: Event) {
    this.showNewMenu.set(false);
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploader.handleFolderInput(Array.from(input.files));
      input.value = '';
    }
  }
}
