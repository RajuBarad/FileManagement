import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IconsModule } from '../../core/modules/icons.module';
import { FileSystemService } from '../../core/services/file-system.service';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { FileSystemItem } from '../../core/models/file-system.model';
import { FilePreviewModalComponent } from '../../components/modal/file-preview-modal.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, IconsModule, RouterModule, FilePreviewModalComponent],
    template: `
    <div class="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Welcome back, {{ authService.currentUser()?.name }}! 👋
        </h1>
        <p class="text-gray-500 dark:text-gray-400">Here's what's happening with your files and tasks.</p>
      </div>

      <!-- Quick Stats / Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        <!-- Quick Actions -->
        <button [routerLink]="['/files']" [queryParams]="{action: 'upload'}" 
                class="group bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl hover:scale-[1.02] transition duration-300 flex flex-col justify-between items-start text-left">
            <div class="p-2 bg-white/20 rounded-lg mb-4 group-hover:bg-white/30 transition">
                <lucide-icon name="upload-cloud" class="h-6 w-6 text-white"></lucide-icon>
            </div>
            <div>
                <span class="block font-bold text-lg">Upload File</span>
                <span class="text-blue-100 text-sm">Add documents to drive</span>
            </div>
        </button>

         <button [routerLink]="['/tasks']" [queryParams]="{action: 'create'}"
                class="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-900 transition duration-300 flex flex-col justify-between items-start text-left">
            <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition">
                <lucide-icon name="check-square" class="h-6 w-6"></lucide-icon>
            </div>
            <div>
                <span class="block font-bold text-lg text-gray-800 dark:text-white">New Task</span>
                <span class="text-gray-400 text-sm">Create a to-do item</span>
            </div>
        </button>

        <button [routerLink]="['/shared']"
                class="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition duration-300 flex flex-col justify-between items-start text-left">
            <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-4 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition">
                <lucide-icon name="users" class="h-6 w-6"></lucide-icon>
            </div>
            <div>
                <span class="block font-bold text-lg text-gray-800 dark:text-white">Shared Details</span>
                <span class="text-gray-400 text-sm">View received files</span>
            </div>
        </button>
      </div>

      <!-- Recent Files -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800 dark:text-white">Recent Files</h2>
            <a routerLink="/files" class="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</a>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                            <th class="p-4 pl-6">Name</th>
                            <th class="p-4">Size</th>
                            <th class="p-4">Status</th>
                            <th class="p-4">Last Modified</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        @for (file of recentFiles(); track file.id) {
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer" (click)="onItemClick(file)">
                                <td class="p-4 pl-6">
                                    <div class="flex items-center gap-3">
                                        <div class="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                            <lucide-icon [name]="getFileIcon(file)" class="h-5 w-5"></lucide-icon>
                                        </div>
                                        <div>
                                            <p class="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[200px]">{{ file.name }}</p>
                                            <p class="text-xs text-gray-400">{{ file.type }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4 text-sm text-gray-500 dark:text-gray-400">{{ formatSize(file.size) }}</td>
                                <td class="p-4">
                                     <span class="px-2 py-1 rounded-full text-xs font-medium" 
                                        [ngClass]="file.isShared ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'">
                                        {{ file.isShared ? 'Shared' : 'Private' }}
                                     </span>
                                </td>
                                <td class="p-4 text-sm text-gray-500 dark:text-gray-400">{{ file.lastModified | date:'MMM d, y' }}</td>
                            </tr>
                        }
                        @if (recentFiles().length === 0) {
                             <tr>
                                <td colspan="4" class="p-8 text-center text-gray-400">
                                    No recent files found.
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      <app-file-preview-modal #previewModal></app-file-preview-modal>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    fileService = inject(FileSystemService);
    authService = inject(AuthService);
    router = inject(Router);

    recentFiles = signal<FileSystemItem[]>([]);
    storageUsage = signal<{ used: number, total: number, percentage: number }>({ used: 0, total: 0, percentage: 0 });

    @ViewChild('previewModal') previewModal!: FilePreviewModalComponent;

    ngOnInit() {
        // Fetch files and filter for recent (mock logic for now, just taking first 5)
        // Ideally API should support ?sort=recent&limit=5
        this.fileService.getItems(null).subscribe(files => {
            // Sort by lastModified descending and take 5
            const sorted = [...files].sort((a, b) => {
                const dateA = new Date(a.lastModified).getTime();
                const dateB = new Date(b.lastModified).getTime();
                return dateB - dateA;
            });
            this.recentFiles.set(sorted.slice(0, 5));
        });

        this.fileService.getStorageUsage().subscribe(data => {
            const percentage = (data.totalUsedBytes / data.quotaBytes) * 100;
            this.storageUsage.set({
                used: data.totalUsedBytes,
                total: data.quotaBytes,
                percentage: Math.min(percentage, 100)
            });
        });
    }

    onItemClick(file: FileSystemItem) {
        if (file.type === 'folder') {
            this.router.navigate(['/files', file.id]);
        } else {
            this.previewModal.open(file);
        }
    }

    getFileIcon(file: FileSystemItem): string {
        switch (file.type) {
            case 'folder': return 'folder';
            case 'image': return 'image';
            case 'pdf': return 'file-text';
            case 'doc': return 'file-text';
            case 'sheet': return 'file-spreadsheet';
            default: return 'file';
        }
    }

    formatSize(bytes: number | undefined): string {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
