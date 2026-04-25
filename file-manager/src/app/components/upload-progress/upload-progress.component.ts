import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadProgressService } from '../../core/services/upload-progress.service';
import { IconsModule } from '../../core/modules/icons.module';

@Component({
   selector: 'app-upload-progress',
   standalone: true,
   imports: [CommonModule, IconsModule],
   template: `
    @if (uploadService.uploads().length > 0) {
      <div class="fixed bottom-6 right-24 w-96 bg-white rounded-t-xl shadow-2xl overflow-hidden border border-gray-200 z-[120] flex flex-col transition-all duration-300"
           [class.h-12]="uploadService.isMinimized()"
           [class.h-auto]="!uploadService.isMinimized()"
           [class.max-h-[450px]]="!uploadService.isMinimized()">
        
        <!-- Header -->
        <div class="text-white px-4 py-3 flex items-center justify-between cursor-pointer transition-colors duration-500 shadow-sm"
             [ngClass]="headerColor()"
             (click)="uploadService.toggleMinimize()">
          <div class="flex items-center gap-2">
             <lucide-icon [name]="isSuccess() ? 'check-circle' : (hasErrors() ? 'alert-circle' : 'upload')" class="h-4 w-4"></lucide-icon>
             <span class="font-semibold text-sm tracking-tight">
                {{ activeCount() > 0 ? 'Uploading ' + activeCount() + ' items...' : (hasErrors() ? 'Uploads complete with errors' : 'Uploads complete') }}
             </span>
          </div>
          <div class="flex items-center gap-1.5">
             <button (click)="$event.stopPropagation(); uploadService.toggleMinimize()" class="hover:bg-white/20 p-1.5 rounded-full transition-colors">
               <lucide-icon [name]="uploadService.isMinimized() ? 'chevron-up' : 'chevron-down'" class="h-4 w-4"></lucide-icon>
             </button>
             <button (click)="$event.stopPropagation(); uploadService.close()" class="hover:bg-white/20 p-1.5 rounded-full transition-colors">
               <lucide-icon name="x" class="h-4 w-4"></lucide-icon>
             </button>
          </div>
        </div>

        <!-- content -->
        <div class="flex-1 overflow-y-auto bg-gray-50/30 p-0 custom-scrollbar">
          <ul class="divide-y divide-gray-100">
             @for (item of uploads(); track item.id) {
                <li class="px-4 py-3 hover:bg-white transition-all relative group"
                    [class.bg-white]="!item.parentId"
                    [class.bg-gray-50]="item.parentId"
                    [style.padding-left.px]="item.parentId ? 48 : 16">
                  
                  @if (item.parentId) {
                     <div class="absolute left-6 top-0 h-1/2 w-4 border-l-2 border-b-2 border-gray-200 rounded-bl-lg"></div>
                     @if (hasNextSibling(item)) {
                        <div class="absolute left-6 top-1/2 bottom-0 w-px bg-gray-200"></div>
                     }
                  }

                  <div class="flex items-center mb-1 justify-between">
                     <div class="flex items-center gap-2.5 truncate pr-4">
                        <div class="p-1.5 rounded-lg" [class.bg-red-50]="item.status === 'error'" [class.bg-blue-50]="item.status === 'uploading'" [class.bg-emerald-50]="item.status === 'completed' && !item.parentId">
                           <lucide-icon [name]="item.type === 'folder' ? 'folder' : 'file'" 
                                       class="h-4 w-4 flex-shrink-0" 
                                       [class.text-red-500]="item.status === 'error'" 
                                       [class.text-blue-500]="item.status === 'uploading'"
                                       [class.text-emerald-500]="item.status === 'completed'"
                                       [class.text-gray-400]="item.status === 'completed' && item.parentId"></lucide-icon>
                        </div>
                        <div class="flex flex-col truncate">
                           <span class="text-sm font-semibold truncate" [class.text-red-600]="item.status === 'error'" [class.text-gray-800]="item.status !== 'error'" [title]="item.name">{{ item.name }}</span>
                           @if (item.status === 'completed' && item.totalInfo) {
                              <span class="text-[10px] text-gray-400 font-medium">{{ item.totalInfo }}</span>
                           }
                        </div>
                     </div>
                     <div class="flex-shrink-0">
                         @if (item.status === 'completed') {
                            <div class="bg-emerald-100 rounded-full p-0.5">
                               <lucide-icon name="check" class="h-3 w-3 text-emerald-600"></lucide-icon>
                            </div>
                         } @else if (item.status === 'error') {
                            <div class="bg-red-100 rounded-full p-0.5">
                               <lucide-icon name="x" class="h-3 w-3 text-red-600"></lucide-icon>
                            </div>
                         }
                     </div>
                  </div>

                  @if (item.status === 'uploading') {
                     <div class="ml-9">
                        <div class="w-full bg-gray-100 rounded-full h-1.5 mb-1.5 mt-2 shadow-inner overflow-hidden">
                          <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                               [style.width.%]="item.progress"></div>
                        </div>
                        <div class="flex justify-between text-[10px] font-bold text-gray-500 items-center">
                           <div class="flex gap-2 items-center">
                               <span class="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{{ item.progress | number:'1.0-0' }}%</span>
                               @if (item.totalInfo) {
                                 <span class="text-gray-400 font-medium italic">{{ item.totalInfo }}</span>
                               }
                           </div>
                           @if (item.progress < 100) {
                              <button (click)="uploadService.cancelUpload(item.id)" class="text-red-500 hover:text-red-700 font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded hover:bg-red-50 transition-colors">
                                  Cancel
                              </button>
                           }
                        </div>
                     </div>
                  }
                </li>
             }
          </ul>
        </div>
      </div>
    }

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #d1d5db;
      }
    </style>
  `
})
export class UploadProgressComponent {
   uploadService = inject(UploadProgressService);
   uploads = this.uploadService.uploads;

   activeCount = computed(() => this.uploads().filter(u => u.status === 'uploading').length);
   hasErrors = computed(() => this.uploads().some(u => u.status === 'error'));
   isSuccess = computed(() => this.uploads().length > 0 && this.activeCount() === 0 && !this.hasErrors());

   headerColor = computed(() => {
      if (this.hasErrors()) return 'bg-red-600';
      if (this.activeCount() > 0) return 'bg-gray-900';
      if (this.isSuccess()) return 'bg-emerald-600';
      return 'bg-gray-900';
   });

   hasNextSibling(item: any) {
      const all = this.uploads();
      const index = all.findIndex(u => u.id === item.id);
      if (index === -1 || index === all.length - 1) return false;
      return all[index + 1].parentId === item.parentId;
   }
}
