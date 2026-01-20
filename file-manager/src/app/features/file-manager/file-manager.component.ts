import { Component, OnInit, inject, signal, computed, ViewChild, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, combineLatest } from 'rxjs';
import { FileSystemService } from '../../core/services/file-system.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { FileSystemItem } from '../../core/models/file-system.model';
import { User } from '../../core/models/user.model';
import { LucideAngularModule, ChevronRight, Home, Folder, FolderOpen, Grid, List, Share2, File, FileText, FileSpreadsheet, Image, X, Check, Cloud, Plus, Trash2, Clock, Star, HardDrive, MoreVertical, ChevronDown, Edit3, Download, ExternalLink, FolderUp, Lock, RotateCcw, Users } from 'lucide-angular';
// rotate-ccw for restore
import { ModalComponent } from '../../components/modal/modal.component';
import Swal from 'sweetalert2';

import { FileUploaderService } from '../../core/services/file-uploader.service';
import { IconsModule } from '../../core/modules/icons.module';
import { FilePreviewModalComponent } from '../../components/modal/file-preview-modal.component';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [
    CommonModule,
    IconsModule,
    FormsModule,
    ModalComponent,
    FilePreviewModalComponent
  ],
  template: `
    <div class="h-full flex flex-col relative" (click)="closeContextMenu()">
      <!-- Drag Overlay -->
      <div *ngIf="isDragging()" class="absolute inset-0 bg-blue-50/90 z-[100] flex flex-col items-center justify-center border-4 border-blue-500 border-dashed rounded-lg animate-in fade-in duration-200 pointer-events-none">
         <div class="bg-white p-6 rounded-full shadow-lg mb-4 animate-bounce">
            <lucide-icon name="cloud" class="h-12 w-12 text-blue-600"></lucide-icon>
         </div>
         <h3 class="text-2xl font-bold text-blue-700">Drop files here</h3>
         <p class="text-blue-500 mt-2">Upload to current folder</p>
      </div>
      <!-- Toolbar -->
      <!-- Toolbar with Breadcrumbs -->
      <div class="flex items-center justify-between mb-2 px-1 gap-4">
         <!-- Breadcrumbs -->
         <div class="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div (click)="navigateRoot()" class="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition font-medium flex-shrink-0">
               <lucide-icon [name]="breadcrumbRootLabel() === 'Shared with me' ? 'users' : 'home'" class="h-4 w-4"></lucide-icon>
               <span>{{ breadcrumbRootLabel() }}</span>
            </div>
            
            @for (crumb of breadcrumbs(); track crumb.id) {
               <lucide-icon name="chevron-right" class="h-4 w-4 text-gray-400 flex-shrink-0"></lucide-icon>
               <div class="flex items-center gap-1 min-w-0">
                  <span (click)="navigateToFolder(crumb.id)" 
                        [class.font-bold]="crumb.id === fileService.currentFolderId()"
                        class="cursor-pointer hover:text-blue-600 hover:underline transition truncate max-w-[150px]">
                     {{ crumb.name }}
                  </span>
               </div>
            }
         </div>

        <div class="flex items-center gap-4 flex-shrink-0">
             <div class="flex items-center bg-gray-100 rounded-lg p-1">
              <button class="p-1.5 rounded-md transition" [class.bg-white]="viewMode() === 'grid'" [class.shadow-sm]="viewMode() === 'grid'" (click)="viewMode.set('grid')">
                <lucide-icon name="grid" class="h-5 w-5 text-gray-600"></lucide-icon>
              </button>
              <button class="p-1.5 rounded-md transition" [class.bg-white]="viewMode() === 'list'" [class.shadow-sm]="viewMode() === 'list'" (click)="viewMode.set('list')">
                <lucide-icon name="list" class="h-5 w-5 text-gray-600"></lucide-icon>
              </button>
            </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto pb-10">
        <!-- Grid View -->
        <div *ngIf="viewMode() === 'grid'" class="space-y-8">
          
          <!-- Folders Section -->
          <div *ngIf="folders().length > 0">
             <div class="flex items-center justify-between mb-4">
                <h3 class="text-gray-500 font-medium text-sm">Folders</h3>
             </div>
             
             <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              @for (item of folders(); track item.id) {
                <div class="group bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition cursor-pointer flex items-center justify-between p-3 relative"
                     (contextmenu)="$event.preventDefault(); openContextMenu($event, item)">
                    
                    <div class="flex items-center gap-3 flex-1 min-w-0" (dblclick)="onItemClick(item)">
                        <div class="text-gray-500 relative">
                           <lucide-icon [name]="getIcon(item.type)" class="h-5 w-5 fill-gray-500 text-gray-500"></lucide-icon>
                           <div *ngIf="item.isLocked" class="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white" [title]="'Locked by ' + item.lockedByUserName">
                              <lucide-icon name="lock" class="h-2 w-2 text-white"></lucide-icon>
                           </div>
                           <div *ngIf="item.accessType === 'Shared' || item.isShared" class="absolute -bottom-1 -right-1 bg-blue-100 rounded-full p-0.5 border border-white" title="Shared">
                              <lucide-icon name="users" class="h-2 w-2 text-blue-600"></lucide-icon>
                           </div>
                        </div>
                        <span class="font-medium text-sm text-gray-700 truncate">{{ item.name }}</span>
                    </div>

                    <button class="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition focus:opacity-100"
                            (click)="$event.stopPropagation(); openContextMenu($event, item)">
                       <lucide-icon name="more-vertical" class="h-4 w-4"></lucide-icon>
                    </button>
                    
                    <!-- Inline Context Menu (if easier than global) -->
                </div>
              }
             </div>
          </div>

          <!-- Files Section -->
          <div *ngIf="filesList().length > 0">
             <div class="flex items-center justify-between mb-4">
                 <h3 class="text-gray-500 font-medium text-sm">Files</h3>
             </div>

             <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table class="w-full text-left border-collapse">
                   <thead class="text-xs font-medium text-gray-500 border-b border-gray-200 bg-gray-50">
                     <tr>
                       <th class="px-4 py-3 font-medium w-1/2">Name</th>
                       <th class="px-4 py-3 font-medium w-24">Size</th>
                       <th class="px-4 py-3 font-medium w-48">Date modified</th>
                       <th class="px-4 py-3 font-medium w-40">Owner</th>
                       <th class="px-4 py-3 font-medium w-10"></th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-100 text-sm">
                     @for (item of filesList(); track item.id) {
                       <tr (dblclick)="onItemClick(item)" class="group hover:bg-gray-50 cursor-pointer transition select-none"
                           (contextmenu)="$event.preventDefault(); openContextMenu($event, item)">
                         <td class="px-4 py-3">
                           <div class="flex items-center gap-3">
                              <lucide-icon [name]="getIcon(item.type)" [class]="'h-5 w-5 ' + getIconColor(item.type)"></lucide-icon>
                             <span class="font-medium text-gray-700 truncate max-w-[300px]">{{ item.name }}</span>
                             <lucide-icon *ngIf="item.accessType === 'Shared' || item.isShared" name="users" class="h-4 w-4 text-blue-500 ml-2" title="Shared"></lucide-icon>
                           </div>
                         </td>
                         <td class="px-4 py-3 text-gray-500 text-sm">{{ formatSize(item.size) }}</td>
                         <td class="px-4 py-3 text-gray-500">
                           {{ item.lastModified | date:'medium' }}
                         </td>
                         <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                               <div class="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-gray-100"
                                    [class.bg-blue-100]="item.ownerId === authService.currentUser()?.id"
                                    [class.text-blue-700]="item.ownerId === authService.currentUser()?.id"
                                    [class.bg-orange-100]="item.ownerId !== authService.currentUser()?.id"
                                    [class.text-orange-700]="item.ownerId !== authService.currentUser()?.id">
                              {{ (item.ownerId === authService.currentUser()?.id ? 'Me' : (item.ownerName ? item.ownerName.substring(0, 1) : 'O')) | uppercase }}
                           </div>
                           <span class="text-gray-500 text-xs">{{ item.ownerId === authService.currentUser()?.id ? 'me' : item.ownerName }}</span>
                        </div>
                         </td>
                         <td class="px-4 py-3 text-right">
                             <div class="flex items-center justify-end gap-1">
                                <button class="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        (click)="$event.stopPropagation(); openContextMenu($event, item)">
                                   <lucide-icon name="more-vertical" class="h-4 w-4"></lucide-icon>
                                </button>
                             </div>
                         </td>
                       </tr>
                     }
                   </tbody>
                </table>
             </div>
          </div>
          
          <div *ngIf="items().length === 0" class="text-center py-10 text-gray-400">
            Folder is empty
          </div>
        </div>

        <!-- List View -->
        <div *ngIf="viewMode() === 'list'" class="space-y-4">
           <div class="bg-white rounded-lg overflow-x-auto">
             <table class="w-full text-left border-collapse min-w-[600px] md:min-w-0">
               <thead class="text-xs font-medium text-gray-500 border-b border-gray-200">
                 <tr>
                   <th class="px-4 py-3 font-medium w-full md:w-1/2">Name</th>
                   <th class="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">Size</th>
              <th class="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">
                  {{ isTrashView() ? 'Deleted Date' : 'Date Modified' }}
              </th>
              <th class="py-3 px-4 text-left font-medium text-gray-500 hidden md:table-cell">
                  {{ isTrashView() ? 'Deleted By' : 'Owner' }}
              </th>
              <th class="py-3 px-4 text-right font-medium text-gray-500 rounded-tr-xl"></th>
                 </tr>
               </thead>
               <tbody class="divide-y divide-gray-100 text-sm">
                 <!-- Folders -->
                 @for (item of folders(); track item.id) {
                   <tr (dblclick)="onItemClick(item)" class="group hover:bg-gray-100/50 cursor-pointer transition select-none"
                       (contextmenu)="$event.preventDefault(); openContextMenu($event, item)">
                     <td class="px-4 py-2">
                       <div class="flex items-center gap-3">
                         <lucide-icon [name]="getIcon(item.type)" class="h-5 w-5 text-gray-500 fill-gray-500/20 flex-shrink-0"></lucide-icon>
                         <span class="font-medium text-gray-700 truncate max-w-[200px] md:max-w-[300px]">{{ item.name }}</span>
                         <lucide-icon *ngIf="item.accessType === 'Shared' || item.isShared" name="users" class="h-4 w-4 text-blue-500 ml-2" title="Shared"></lucide-icon>
                       </div>
                     </td>
                     <td class="py-3 px-4 text-gray-500 hidden md:table-cell">{{ formatSize(item.size, item.type === 'folder') }}</td>
              <td class="py-3 px-4 text-gray-500 hidden md:table-cell">
                  {{ (isTrashView() ? item.deletedAt : (item.lastModified || item.lockedOn)) | date:'mediumDate' }}
              </td>
              <td class="py-3 px-4 hidden md:table-cell">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        [ngClass]="{'bg-blue-50 text-blue-700': isOwner(item), 'bg-purple-50 text-purple-700': !isOwner(item)}">
                      {{ isTrashView() ? (item.deletedByName || 'Unknown') : item.ownerName }}
                  </span>
              </td>
                   <td class="px-4 py-2 text-right">
                      <button class="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                              (click)="$event.stopPropagation(); openContextMenu($event, item)">
                         <lucide-icon name="more-vertical" class="h-4 w-4"></lucide-icon>
                      </button>
                   </td>
                   </tr>
                 }
                 
                 <!-- Files -->
                 @for (item of filesList(); track item.id) {
                   <tr (dblclick)="onItemClick(item)" class="group hover:bg-gray-100/50 cursor-pointer transition select-none"
                       (contextmenu)="$event.preventDefault(); openContextMenu($event, item)">
                     <td class="px-4 py-2">
                       <div class="flex items-center gap-3">
                          <lucide-icon [name]="getIcon(item.type)" class="h-5 w-5 text-red-500 flex-shrink-0" *ngIf="item.type === 'pdf'"></lucide-icon>
                          <lucide-icon [name]="getIcon(item.type)" class="h-5 w-5 text-blue-500 flex-shrink-0" *ngIf="item.type === 'doc'"></lucide-icon>
                          <lucide-icon [name]="getIcon(item.type)" class="h-5 w-5 text-green-500 flex-shrink-0" *ngIf="item.type === 'sheet'"></lucide-icon>
                          <lucide-icon [name]="getIcon(item.type)" class="h-5 w-5 text-purple-500 flex-shrink-0" *ngIf="item.type === 'image'"></lucide-icon>
                          <lucide-icon [name]="getIcon(item.type)" class="h-5 w-5 text-gray-500 flex-shrink-0" *ngIf="!['pdf','doc','sheet','image'].includes(item.type)"></lucide-icon>
                         <span class="font-medium text-gray-700 truncate max-w-[200px] md:max-w-[300px]">{{ item.name }}</span>
                       </div>
                     </td>
                     <td class="px-4 py-2 text-gray-500 text-sm hidden md:table-cell">{{ formatSize(item.size) }}</td>
                     <td class="px-4 py-2 text-gray-500 hidden md:table-cell">
                       {{ item.lastModified | date:'medium' }}
                     </td>
                     <td class="px-4 py-2 hidden md:table-cell">
                        <div class="flex items-center gap-2">
                           <div class="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-gray-100"
                                [class.bg-blue-100]="item.ownerId === authService.currentUser()?.id"
                                [class.text-blue-700]="item.ownerId === authService.currentUser()?.id"
                                [class.bg-orange-100]="item.ownerId !== authService.currentUser()?.id"
                                [class.text-orange-700]="item.ownerId !== authService.currentUser()?.id">
                             {{ (item.ownerId === authService.currentUser()?.id ? 'Me' : (item.ownerName ? item.ownerName.substring(0, 1) : 'O')) | uppercase }}
                           </div>
                           <span class="text-gray-500 text-xs">{{ item.ownerId === authService.currentUser()?.id ? 'me' : item.ownerName }}</span>
                        </div>
                         </td>
                         <td class="px-4 py-2">
                             <div class="flex items-center justify-end gap-1">
                                <button class="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                                        (click)="$event.stopPropagation(); openContextMenu($event, item)">
                                   <lucide-icon name="more-vertical" class="h-4 w-4"></lucide-icon>
                                </button>
                             </div>
                         </td>
                       </tr>
                     }</tbody>
             </table>
             
             <div *ngIf="items().length === 0" class="text-center py-10 text-gray-400">
                 Folder is empty
             </div>
           </div>
        </div>
      </div>

      <!-- Context Menu -->
      <div *ngIf="contextMenuVisible()" 
           class="fixed bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
           [style.left.px]="contextMenuPosition().x"
           [style.top.px]="contextMenuPosition().y">
         
          <div class="px-4 py-3 border-b border-gray-100">
              <h3 class="font-medium text-gray-900 truncate">{{ selectedItem()?.name }}</h3>
          </div>

          <button *ngIf="selectedItem()?.type !== 'folder'" (click)="openPreview(selectedItem()!)" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
              <lucide-icon name="eye" class="h-4 w-4 text-gray-500"></lucide-icon>
              Preview
          </button>

          <button *ngIf="!isTrashView() && selectedItem()?.accessType !== 'Shared'" (click)="openShareModal(selectedItem()!)" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 first:rounded-t-lg">
              <lucide-icon name="share-2" class="h-4 w-4 text-blue-500"></lucide-icon>
              Share
          </button>

          <button *ngIf="!isTrashView()" (click)="downloadSelectedItem()" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
              <lucide-icon name="download" class="h-4 w-4 text-gray-500"></lucide-icon>
              Download
          </button>
          
          <button *ngIf="!isTrashView()" (click)="toggleStar(selectedItem()!)" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
             <lucide-icon [name]="selectedItem()?.isStarred ? 'star' : 'star'" [class]="selectedItem()?.isStarred ? 'h-4 w-4 text-yellow-400 fill-current' : 'h-4 w-4 text-gray-500'"></lucide-icon>
             {{ selectedItem()?.isStarred ? 'Remove from Starred' : 'Add to Starred' }}
          </button>

          <div *ngIf="isTrashView()" class="my-1 border-t border-gray-100"></div>

          <button *ngIf="isTrashView()" (click)="restoreSelectedItem()" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
             <lucide-icon name="rotate-ccw" class="h-4 w-4 text-green-500"></lucide-icon>
             Restore
          </button>

          <button *ngIf="isTrashView() && authService.isAdmin()" (click)="deletePermanentSelectedItem()" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50">
             <lucide-icon name="trash-2" class="h-4 w-4 text-red-500"></lucide-icon>
             Delete Permanently
          </button>

         <button *ngIf="!isTrashView() && selectedItem()?.accessType !== 'Shared'" (click)="renameSelectedItem()" class="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
             <lucide-icon name="edit-3" class="h-4 w-4 text-gray-500"></lucide-icon>
            Rename
         </button>

         <div *ngIf="!isTrashView()" class="my-1 border-t border-gray-100"></div>

         <button *ngIf="!isTrashView() && selectedItem()?.accessType !== 'Shared'" (click)="deleteSelectedItem()" class="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600">
            <lucide-icon name="trash-2" class="h-4 w-4 text-red-500"></lucide-icon>
            Delete
         </button>

         <div class="my-1 border-t border-gray-100" *ngIf="selectedItem()?.isLocked && (authService.isAdmin() || selectedItem()?.lockedByUserId === authService.currentUser()?.id)"></div>

         <button *ngIf="selectedItem()?.isLocked && (authService.isAdmin() || selectedItem()?.lockedByUserId == authService.currentUser()?.id)" 
                 (click)="unlockSelectedItem()" 
                 class="w-full text-left px-4 py-2 hover:bg-orange-50 flex items-center gap-2 text-sm text-orange-600">
             <lucide-icon name="lock" class="h-4 w-4 text-orange-500"></lucide-icon>
             Unlock File
         </button>
      </div>

      <!-- Share Modal (Existing) -->
      <div *ngIf="showShareModal()" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <!-- ... existing share modal content ... -->
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
             <div class="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-800">Share "{{ selectedItem()?.name }}"</h3>
                <button (click)="closeShareModal()" class="text-gray-400 hover:text-gray-600">
                   <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
                </button>
             </div>
             
             <div class="p-6">
                <div class="mb-4">
                   <label class="block text-sm font-medium text-gray-700 mb-2">Select Users</label>
                   <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      @for (user of users(); track user.id) {
                         <div *ngIf="user.id !== authService.currentUser()?.id" 
                              class="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                              (click)="toggleUserSelection(user.id)">
                            <div class="flex items-center gap-3">
                               <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                  {{ user.name.substring(0, 2).toUpperCase() }}
                               </div>
                               <div class="text-sm">
                                  <p class="font-medium text-gray-800">{{ user.name }}</p>
                                  <p class="text-gray-500 text-xs">{{ user.email }}</p>
                               </div>
                            </div>
                            <div class="h-5 w-5 border-2 rounded-full flex items-center justify-center transition"
                                 [class.border-blue-500]="selectedUserIds().has(user.id)"
                                 [class.bg-blue-500]="selectedUserIds().has(user.id)">
                               <lucide-icon *ngIf="selectedUserIds().has(user.id)" name="check" class="h-3 w-3 text-white"></lucide-icon> 
                            </div>
                         </div>
                      }
                   </div>
                </div>
                
                <div class="flex justify-end gap-3">
                   <button (click)="closeShareModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm">Cancel</button>
                   <button (click)="confirmShare()" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 shadow-sm disabled:opacity-50">
                      Save
                   </button>
                </div>
             </div>
          </div>
      </div>
      <app-modal #renameModal
          title="Rename"
          placeholder="Enter new name"
          actionButtonText="Rename"
          (onConfirm)="onRenameConfirm($event)">
      </app-modal>

      <app-file-preview-modal #previewModal></app-file-preview-modal>
    </div>
  `
})
export class FileManagerComponent implements OnInit {
  public fileService = inject(FileSystemService);
  public authService = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private uploader = inject(FileUploaderService);

  isDragging = signal(false);

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Only set false if leaving the window or main container (logic can be adjusted)
    // Simple check: if relatedTarget is null (left window) or we want strict container leave
    if (event.relatedTarget === null) {
      this.isDragging.set(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.items) {
      this.uploader.handleDroppedItems(event.dataTransfer.items);
    }
  }

  @ViewChild('renameModal') renameModal!: ModalComponent;
  @ViewChild('previewModal') previewModal!: FilePreviewModalComponent;

  // items = signal<FileSystemItem[]>([]); // Removed local signal
  items = this.fileService.files; // Use service signal directly

  folders = computed(() => this.items().filter(params => params.type === 'folder'));
  filesList = computed(() => this.items().filter(params => params.type !== 'folder'));

  currentSection = signal<string>('files'); // files, shared, starred, trash

  breadcrumbs = signal<{ id: string, name: string, ownerId: any }[]>([]);

  // Computed label for the root breadcrumb
  breadcrumbRootLabel = computed(() => {
    // If explicit section (root view)
    if (this.currentSection() === 'shared') return 'Shared with me';
    if (this.currentSection() === 'starred') return 'Starred';
    if (this.currentSection() === 'trash') return 'Trash';

    // Deep folder navigation context logic
    const crumbs = this.breadcrumbs();
    const currentUser = this.authService.currentUser();

    // If we have breadcrumbs and the top-level folder is NOT owned by me, it's "Shared with me"
    if (crumbs.length > 0 && currentUser && crumbs[0].ownerId != currentUser.id) {
      return 'Shared with me';
    }
    return 'My Drive';
  });

  viewMode = signal<'grid' | 'list'>((localStorage.getItem('fileManagerViewMode') as 'grid' | 'list') || 'grid');

  constructor() {
    effect(() => {
      localStorage.setItem('fileManagerViewMode', this.viewMode());
    });
  }

  // Sharing Logic
  showShareModal = signal(false);
  selectedItem = signal<FileSystemItem | null>(null);
  users = signal<User[]>([]);
  selectedUserIds = signal<Set<string>>(new Set()); // Using generic set for IDs
  originalSharedUserIds = signal<Set<string>>(new Set());

  // Context Menu Logic
  contextMenuVisible = signal(false);
  contextMenuPosition = signal<{ x: number, y: number }>({ x: 0, y: 0 });

  openContextMenu(event: MouseEvent, item: FileSystemItem) {
    event.preventDefault();
    event.stopPropagation();

    // Always find the latest version of the item from our signal to ensure state (isStarred, etc) is fresh
    const freshItem = this.items().find(f => f.id === item.id) || item;
    this.selectedItem.set(freshItem);

    const menuWidth = 220; // Approximate width of the context menu
    const menuHeight = 300; // Approximate height of the context menu
    let x = event.clientX;
    let y = event.clientY;

    // Check right boundary
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10; // Shift left with padding
    }

    // Check bottom boundary
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10; // Shift up with padding
    }

    this.contextMenuPosition.set({ x, y });
    this.contextMenuVisible.set(true);
  }

  closeContextMenu() {
    this.contextMenuVisible.set(false);
  }



  toggleStar(item: FileSystemItem) {
    if (!item) return;
    this.fileService.toggleStar(item.id).subscribe((isStarred) => {
      // Update the selected item immediately so context menu would be correct if reopened
      this.selectedItem.update(current => {
        if (current && current.id === item.id) {
          return { ...current, isStarred };
        }
        return current;
      });

      this.closeContextMenu();

      // If we are in "Starred" view and we just unstarred, we should likely remove it from view.
      // The service updates the main 'files' signal, but if we are in 'starred' mode, 
      // the list is filtered on the backend usually. 
      // If we want it to disappear, we rely on the service's local update.
      // Let's verify if 'filesList' computed updates.

      const currentPath = this.route.snapshot.url[0]?.path;
      if (currentPath === 'starred' && !isStarred) {
        // In Starred view, if we unstar, we want it gone.
        // The service updated the 'isStarred' property to false.
        // But the LIST is just the array of files.
        // We need to remove it from the array if we are in "starred" view.
        this.fileService.files.update(files => files.filter(f => f.id !== item.id));
      }
    });
  }

  downloadSelectedItem() {
    let item = this.selectedItem();
    if (!item) return;

    // Refresh item from the current list to ensure we have the latest lock status
    const itemId = item.id;
    const freshItem = this.fileService.files().find(f => f.id === itemId);
    if (freshItem) {
      item = freshItem;
    }

    if (item.type === 'folder') {
      this.fileService.downloadFolder(item);
    } else {
      const currentUser = this.authService.currentUser();

      const lockerId = String(item.lockedByUserId || '');
      const myId = String(currentUser?.id || '');




      // If already locked by someone else
      if (item.isLocked && lockerId !== myId) {
        if (this.authService.isAdmin()) {
          Swal.fire({
            title: 'File Locked',
            text: `This file is currently being edited by ${item.lockedByUserName} since ${new Date(item.lockedOn!).toLocaleString()}. As Admin, you can download a read-only copy.`,
            icon: 'warning',
            confirmButtonText: 'Download Read-Only'
          }).then((result) => {
            if (result.isConfirmed) {
              this.fileService.downloadFile(item);
            }
          });
        } else {
          Swal.fire({
            title: 'Access Denied',
            text: `This file is currently locked by ${item.lockedByUserName}. Only the locker or an Admin can download this file.`,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
        return;
      }

      // If already locked by ME, just download
      if (item.isLocked && lockerId === myId) {
        this.fileService.downloadFile(item);
        return;
      }

      // If NOT locked, ask the user
      Swal.fire({
        title: 'Are you working on this file?',
        text: "This will lock the file for other users. You can upload it again to replace and unlock it.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Lock & Download',
        cancelButtonText: 'No, Just Download',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          // Lock & Download
          this.fileService.lockFile(item.id).subscribe({
            next: () => {
              this.toast.show('File locked for editing', 'info');
              this.fileService.downloadFile(item);
              this.loadItems(this.fileService.currentFolderId());
            },
            error: (err) => {
              console.error(err);
              this.toast.show('Failed to lock file', 'error');
              // Fallback download?
              this.fileService.downloadFile(item);
            }
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Just Download
          this.fileService.downloadFile(item);
        }
      });
    }
    this.closeContextMenu();
  }

  unlockSelectedItem() {
    const item = this.selectedItem();
    if (!item) return;

    this.fileService.unlockFile(item.id).subscribe({
      next: () => {
        this.toast.show('File unlocked', 'success');
        this.loadItems(this.fileService.currentFolderId());
      },
      error: (err) => this.toast.show('Failed to unlock', 'error')
    });
    this.closeContextMenu();
  }

  renameSelectedItem() {
    const item = this.selectedItem();
    if (!item) return;

    this.renameModal.openWithValue(item.name);
    this.closeContextMenu();
  }

  onRenameConfirm(newName: string) {
    const item = this.selectedItem();
    if (!item || !newName || newName === item.name) return;

    this.fileService.updateItem(item.id, { name: newName }).subscribe({
      next: () => {
        this.toast.show('Renamed successfully', 'success');
        this.loadItems(this.fileService.currentFolderId());
      },
      error: (err) => console.error(err)
    });
  }

  restoreSelectedItem() {
    const item = this.selectedItem();
    if (!item) return;
    this.closeContextMenu();

    this.fileService.restoreFile(item.id).subscribe(() => {
      this.toast.show('File restored', 'success');
      this.loadItems(null, 'trash');
    });
  }

  deletePermanentSelectedItem() {
    const item = this.selectedItem();
    if (!item) return;
    this.closeContextMenu();

    Swal.fire({
      title: 'Delete Permanently?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.fileService.deletePermanent(item.id).subscribe(() => {
          this.toast.show('File deleted permanently', 'success');
          this.loadItems(null, 'trash');
        });
      }
    });
  }

  deleteSelectedItem() {
    const item = this.selectedItem();
    if (!item) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.fileService.deleteItem(item.id).subscribe(() => {
          Swal.fire(
            'Deleted!',
            'Your file has been deleted.',
            'success'
          );
          this.closeContextMenu();
          this.loadItems(this.fileService.currentFolderId());
        });
      }
    });

    this.closeContextMenu();
  }

  ngOnInit() {
    combineLatest([this.route.url, this.route.params]).subscribe(([segments, params]) => {
      const path = segments[0]?.path;
      if (path === 'starred') {
        this.currentSection.set('starred');
        this.fileService.currentFolderId.set(null); // Clear folder context
        this.loadItems(null, 'starred');
      } else if (path === 'recent') {
        this.currentSection.set('recent');
        this.fileService.currentFolderId.set(null);
        this.loadItems(null, 'recent');
      } else if (path === 'trash') {
        this.currentSection.set('trash');
        this.fileService.currentFolderId.set(null);
        this.loadItems(null, 'trash');
      } else if (path === 'shared') {
        this.currentSection.set('shared');
        this.fileService.currentFolderId.set(null);
        this.loadItems(null, 'shared');
      } else {
        // Normal files view (path is 'files' or empty or folderId)
        // If route is 'files/:folderId', params['folderId'] will be set
        // If route is 'files', params['folderId'] will be undefined/null
        const folderId = params['folderId'] || null;

        // Handle '/files/shared' case where 'shared' is captured as folderId
        if (folderId === 'shared') {
          this.currentSection.set('shared');
          this.fileService.currentFolderId.set(null);
          this.breadcrumbs.set([]); // Clear breadcrumbs to show root "Shared with me"
          this.loadItems(null, 'shared');
        } else {
          this.currentSection.set('files');
          this.loadItems(folderId);
        }
      }
    });

    // Load users for sharing
    // Check if auth service method exists before calling, or assume fixed
    this.authService.getUsers().subscribe(users => this.users.set(users));
  }

  loadItems(folderId: string | null, filter?: string) {
    this.fileService.getItems(folderId, filter).subscribe(() => {
      this.fileService.currentFolderId.set(folderId);
      this.loadBreadcrumbs(folderId);
    });
  }

  loadBreadcrumbs(folderId: string | null) {
    this.fileService.getBreadcrumbs(folderId).subscribe(crumbs => {
      console.log('Received breadcrumbs from API:', crumbs);
      this.breadcrumbs.set(crumbs);
      console.log('Breadcrumbs signal updated:', this.breadcrumbs());
    });
  }

  navigateToFolder(folderId: string | null) {
    if (folderId) {
      this.router.navigate(['/files', folderId]);
    } else {
      // Fallback to root
      this.navigateRoot();
    }
  }

  navigateRoot() {
    if (this.breadcrumbRootLabel() === 'Shared with me') {
      this.router.navigate(['/files/shared']);
    } else {
      this.router.navigate(['/files']);
    }
  }

  onItemClick(item: FileSystemItem) {
    if (item.type === 'folder') {
      this.router.navigate(['/files', item.id]);
    } else {
      // Open preview instead of direct download
      this.previewModal.open(item);
    }
  }

  openPreview(item: FileSystemItem) {
    this.previewModal.open(item);
    this.closeContextMenu();
  }

  openShareModal(item: FileSystemItem) {
    this.selectedItem.set(item);
    this.showShareModal.set(true);

    // Fetch existing shares
    this.fileService.getShareDetails(item.id).subscribe({
      next: (userIds) => {
        // Strings vs Numbers mismatch possible. API returns strings/numbers? 
        // PHP json_encode of INTs are numbers.
        // Set expects ID type matches user.id.
        const set = new Set(userIds.map(id => String(id)));
        this.selectedUserIds.set(set);
        this.originalSharedUserIds.set(new Set(set)); // Track original state
      },
      error: () => console.error('Failed to load share details')
    });
  }

  closeShareModal() {
    this.showShareModal.set(false);
    this.selectedItem.set(null);
    this.selectedUserIds.set(new Set());
  }

  toggleUserSelection(userId: string) {
    this.selectedUserIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(userId)) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });
  }

  confirmShare() {
    const item = this.selectedItem();
    if (!item) return;

    const currentIds = this.selectedUserIds();
    const originalIds = this.originalSharedUserIds();

    // Calculate additions
    const toAdd = Array.from(currentIds).filter(id => !originalIds.has(String(id)));
    // Calculate removals
    const toRemove = Array.from(originalIds).filter(id => !currentIds.has(String(id)));

    if (toAdd.length === 0 && toRemove.length === 0) {
      this.closeShareModal();
      return;
    }

    const totalOps = toAdd.length + toRemove.length;
    let completedOps = 0;
    let errors = 0;

    const checkComplete = () => {
      completedOps++;
      if (completedOps === totalOps) {
        if (errors === 0) {
          this.toast.show('Share settings updated successfully', 'success');
        } else {
          this.toast.show('Some updates failed', 'warning');
        }
        this.closeShareModal();
      }
    };

    // Process Additions
    toAdd.forEach(uid => {
      this.fileService.shareFileWithUser(String(item.id), String(uid)).subscribe({
        next: () => checkComplete(),
        error: (err) => {
          console.error('Share error', err);
          errors++;
          checkComplete();
        }
      });
    });

    // Process Removals
    toRemove.forEach(uid => {
      this.fileService.unshareFileWithUser(String(item.id), String(uid)).subscribe({
        next: () => checkComplete(),
        error: (err) => {
          console.error('Unshare error', err);
          errors++;
          checkComplete();
        }
      });
    });
  }

  isTrashView() {
    return this.currentSection() === 'trash';
  }

  isOwner(item: FileSystemItem): boolean {
    // robust comparison handling number vs string properties
    return String(item.ownerId) === String(this.authService.currentUser()?.id);
  }

  formatSize(bytes: number | undefined, isFolder = false): string {
    if (isFolder) return '-';
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getIcon(type: string): string {
    switch (type) {
      case 'folder': return 'folder';
      case 'pdf': return 'file-text';
      case 'doc': return 'file-text';
      case 'sheet': return 'file-spreadsheet';
      case 'image': return 'image';
      default: return 'file';
    }
  }

  getIconColor(type: string): string {
    switch (type) {
      case 'pdf': return 'text-red-500';
      case 'doc': return 'text-blue-500';
      case 'sheet': return 'text-green-500';
      case 'image': return 'text-purple-500';
      case 'folder': return 'text-yellow-500';
      case 'video': return 'text-pink-500';
      case 'audio': return 'text-cyan-500';
      case 'code': return 'text-blue-400';
      default: return 'text-gray-500';
    }
  }
}
