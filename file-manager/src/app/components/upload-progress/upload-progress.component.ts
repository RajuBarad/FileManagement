import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadProgressService } from '../../core/services/upload-progress.service';
import { IconsModule } from '../../core/modules/icons.module';

@Component({
   selector: 'app-upload-progress',
   standalone: true,
   imports: [CommonModule, IconsModule],
   template: `
    @if (uploadService.uploads().length > 0) {
      <div class="fixed bottom-6 right-6 w-96 bg-white rounded-t-lg shadow-2xl overflow-hidden border border-gray-200 z-[60] flex flex-col transition-all duration-300"
           [class.h-12]="uploadService.isMinimized()"
           [class.h-auto]="!uploadService.isMinimized()"
           [class.max-h-[400px]]="!uploadService.isMinimized()">
        
        <!-- Header -->
        <div class="bg-gray-900 text-white px-4 py-3 flex items-center justify-between cursor-pointer"
             (click)="uploadService.toggleMinimize()">
          <span class="font-medium text-sm">
             {{ getActiveUploadsCount() > 0 ? 'Uploading ' + getActiveUploadsCount() + ' items' : 'Uploads complete' }}
          </span>
          <div class="flex items-center gap-2">
             <button (click)="$event.stopPropagation(); uploadService.toggleMinimize()" class="hover:bg-gray-700 p-1 rounded">
               <lucide-icon [name]="uploadService.isMinimized() ? 'chevron-up' : 'chevron-down'" class="h-4 w-4"></lucide-icon>
             </button>
             <button (click)="$event.stopPropagation(); uploadService.close()" class="hover:bg-gray-700 p-1 rounded">
               <lucide-icon name="x" class="h-4 w-4"></lucide-icon>
             </button>
          </div>
        </div>

        <!-- content -->
        <div class="flex-1 overflow-y-auto bg-white p-0">
          <ul class="divide-y divide-gray-100">
             @for (item of uploadService.uploads(); track item.id) {
                <li class="px-4 py-3 hover:bg-gray-50 group">
                  <div class="flex items-center mb-1.5 justify-between">
                     <div class="flex items-center gap-2 truncate pr-4" [class.text-red-600]="item.status === 'error'">
                        <lucide-icon [name]="item.type === 'folder' ? 'folder' : 'file'" class="h-4 w-4 flex-shrink-0" [class.text-red-500]="item.status === 'error'" [class.text-gray-500]="item.status !== 'error'"></lucide-icon>
                        <span class="text-sm font-medium truncate" [class.text-gray-700]="item.status !== 'error'" [title]="item.name">{{ item.name }}</span>
                     </div>
                     <div class="flex-shrink-0">
                         @if (item.status === 'completed') {
                            <lucide-icon name="check" class="h-4 w-4 text-green-500"></lucide-icon>
                         } @else if (item.status === 'error') {
                            <lucide-icon name="x" class="h-4 w-4 text-red-500"></lucide-icon>
                         }
                     </div>
                  </div>
                 
                 @if (item.status === 'uploading') {
                    <div class="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                      <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                           [style.width.%]="item.progress"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 items-center">
                       <div class="flex gap-2">
                           <span>{{ item.progress | number:'1.0-0' }}%</span>
                           @if (item.totalInfo) {
                             <span>{{ item.totalInfo }}</span>
                           }
                       </div>
                       <button (click)="uploadService.cancelUpload(item.id)" class="text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1">
                           Cancel
                       </button>
                    </div>
                 }
               </li>
             }
          </ul>
        </div>
      </div>
    }
  `
})
export class UploadProgressComponent {
   uploadService = inject(UploadProgressService);

   getActiveUploadsCount() {
      return this.uploadService.uploads().filter(u => u.status === 'uploading').length;
   }
}
