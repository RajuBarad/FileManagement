import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FileSystemService } from '../../core/services/file-system.service';
import { FileSystemItem } from '../../core/models/file-system.model';
import { LucideAngularModule, Folder, ChevronRight, Home, X, Check } from 'lucide-angular';
import { IconsModule } from '../../core/modules/icons.module';

@Component({
  selector: 'app-move-dialog',
  standalone: true,
  imports: [CommonModule, IconsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-gray-100 dark:border-gray-700">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Move "{{ data.itemName }}"</h3>
        <button (click)="close()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
        </button>
      </div>

      <!-- Navigation / Breadcrumb inside Dialog -->
      <div class="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1 text-xs text-gray-500 overflow-x-auto">
        <button (click)="navigateTo(null)" class="hover:underline flex items-center gap-1">
          <lucide-icon name="home" class="h-3 w-3"></lucide-icon>
          <span>My Drive</span>
        </button>
        @for (crumb of breadcrumbs(); track crumb.id) {
          <lucide-icon name="chevron-right" class="h-3 w-3"></lucide-icon>
          <button (click)="navigateTo(crumb.id)" class="hover:underline truncate max-w-[100px]">{{ crumb.name }}</button>
        }
      </div>

      <!-- Folders List -->
      <div class="p-4 max-h-60 overflow-y-auto">
        <p class="text-xs text-gray-400 mb-2">Select destination folder:</p>
        
        <div class="space-y-1">
          <!-- Go to Parent if not root -->
          <div *ngIf="currentFolderId()" (click)="goUp()" class="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer text-sm text-gray-600 dark:text-gray-300">
            <lucide-icon name="folder" class="h-4 w-4 text-gray-400"></lucide-icon>
            <span class="font-medium">.. (Go back)</span>
          </div>

          <!-- Subfolders -->
          @for (folder of folders(); track folder.id) {
            <div *ngIf="folder.id !== data.itemId" 
                 (click)="navigateTo(folder.id)" 
                 class="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer group">
              <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <lucide-icon name="folder" class="h-4 w-4 text-yellow-500 fill-yellow-500/20"></lucide-icon>
                <span class="truncate max-w-[200px]">{{ folder.name }}</span>
              </div>
              <lucide-icon name="chevron-right" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition"></lucide-icon>
            </div>
          }

          <div *ngIf="folders().length === 0" class="text-center py-4 text-xs text-gray-400">
            No subfolders here
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/10">
        <button (click)="close()" class="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium">Cancel</button>
        <button (click)="confirmMove()" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-700 shadow-sm">
          Move Here
        </button>
      </div>
    </div>
  `
})
export class MoveDialogComponent implements OnInit {
  currentFolderId = signal<string | null>(null);
  folders = signal<FileSystemItem[]>([]);
  breadcrumbs = signal<{ id: string, name: string }[]>([]);

  constructor(
    @Inject(DIALOG_DATA) public data: { itemId: string; itemName: string; parentId: string | null },
    public dialogRef: DialogRef<string | null>,
    private fileSystem: FileSystemService
  ) { }

  ngOnInit() {
    this.currentFolderId.set(this.data.parentId);
    this.loadFolders(this.data.parentId);
  }

  loadFolders(parentId: string | null) {
    this.fileSystem.getItems(parentId).subscribe(items => {
        // Filter to only folders, and exclude current item if moving a folder
        this.folders.set(items.filter(i => i.type === 'folder' && i.id !== this.data.itemId));
    });
    
    if (parentId) {
        this.fileSystem.getBreadcrumbs(parentId).subscribe(crumbs => {
            this.breadcrumbs.set(crumbs);
        });
    } else {
        this.breadcrumbs.set([]);
    }
  }

  navigateTo(folderId: string | null) {
    this.currentFolderId.set(folderId);
    this.loadFolders(folderId);
  }

  goUp() {
    const crumbs = this.breadcrumbs();
    if (crumbs.length > 0) {
        // Navigate to grandparent
        const parentIndex = crumbs.length - 1;
        const targetId = parentIndex > 0 ? crumbs[parentIndex - 1].id : null;
        this.navigateTo(targetId);
    } else {
        this.navigateTo(null);
    }
  }

  confirmMove() {
    // Return selected folder ID to caller
    this.dialogRef.close(this.currentFolderId());
  }

  close() {
    this.dialogRef.close(undefined); // undefined means cancel
  }
}
