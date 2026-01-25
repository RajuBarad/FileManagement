import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { Task } from '../../core/models/task.model';
import { IconsModule } from '../../core/modules/icons.module';
import { FileSystemService } from '../../core/services/file-system.service';
import { FileSystemItem } from '../../core/models/file-system.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div *ngIf="isOpen()" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <lucide-icon [name]="getHeaderIcon()" class="h-5 w-5 text-blue-600"></lucide-icon>
            {{ getHeaderTitle() }}
          </h3>
          <button (click)="close()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Task Form (Create/Edit Mode) -->
          <div *ngIf="viewMode !== 'comments'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input type="text" [(ngModel)]="title" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="What needs to be done?">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea [(ngModel)]="description" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Add details..."></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
               <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select [(ngModel)]="priority" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                  </select>
               </div>
               <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input type="date" [(ngModel)]="dueDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
               </div>
            </div>

            <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
               <div class="w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                   <div class="max-h-40 overflow-y-auto p-1 space-y-0.5">
                       @for (user of users(); track user.id) {
                           <label class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer transition">
                               <input type="checkbox" [checked]="isAssigned(user.id)" (change)="toggleAssignee(user.id)" class="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-500 focus:ring-blue-500 bg-white dark:bg-gray-600">
                               <span class="text-sm text-gray-700 dark:text-gray-200 flex-1">{{ user.name }}</span>
                           </label>
                       }
                   </div>
                   <div class="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-t border-gray-100 dark:border-gray-600 flex justify-between items-center text-xs">
                       <span class="text-gray-500 dark:text-gray-400">{{ assignedToIds.length }} selected</span>
                       <button *ngIf="assignedToIds.length > 0" (click)="assignedToIds = []" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">Clear</button>
                   </div>
               </div>
            </div>
          </div>

          <!-- Comments Section (Comments Mode Only) -->
          <div *ngIf="viewMode === 'comments'" class="space-y-6">
              <!-- Task Details Preview -->
              <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                  <h4 class="font-semibold text-gray-800 dark:text-gray-200 text-lg">{{ title }}</h4>
                  <p class="text-gray-600 dark:text-gray-400 mt-1">{{ description || 'No description provided.' }}</p>
                  <div class="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-1"><lucide-icon name="user" class="h-3 w-3"></lucide-icon> {{ assignedToIds.length }} Assignee(s)</span>
                      <span class="flex items-center gap-1"><lucide-icon name="clock" class="h-3 w-3"></lucide-icon> {{ dueDate || 'No due date' }}</span>
                  </div>
              </div>

              <!-- Comments List -->
              <div class="space-y-4">
                  <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
                      Discussion
                  </h5>
                  
                  <div class="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      @for (comment of comments(); track comment.id) {
                          <div class="flex gap-3">
                              <div class="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0">
                                  {{ (comment.authorName || '?').charAt(0).toUpperCase() }}
                              </div>
                              <div class="flex-1">
                                  <div class="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-600">
                                      <div class="flex justify-between items-start">
                                          <span class="font-semibold text-xs text-gray-900 dark:text-gray-200">{{ comment.authorName || 'Unknown User' }}</span>
                                          <span class="text-[10px] text-gray-400">{{ comment.createdAt | date:'short' }}</span>
                                      </div>
                                      <p class="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{{ comment.content }}</p>
                                  </div>
                              </div>
                          </div>
                      }
                      <div *ngIf="comments().length === 0" class="text-center text-gray-400 text-sm py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
                          No comments yet. Start the conversation!
                      </div>
                  </div>

                  <!-- Add Comment Input -->
                  <div class="flex gap-2 pt-2">
                      <input type="text" [(ngModel)]="newComment" (keyup.enter)="addComment()" class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Write a comment...">
                      <button (click)="addComment()" [disabled]="!newComment.trim()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center justify-center">
                          <lucide-icon name="send" class="h-4 w-4"></lucide-icon>
                      </button>
                  </div>

                  <!-- Attachments Section -->
                  <div class="border-t border-gray-100 dark:border-gray-700 pt-6">
                      <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                          <lucide-icon name="paperclip" class="h-4 w-4 text-gray-500 dark:text-gray-400"></lucide-icon>
                          Attachments ({{ attachments().length }})
                      </h4>

                      <!-- Attachments List -->
                      <div class="space-y-2 mb-4">
                           @for (file of attachments(); track file.id) {
                               <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg group hover:border-blue-300 transition">
                                   <div class="flex items-center gap-3 overflow-hidden">
                                       <div class="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                           <span class="text-xs font-bold">{{ file.extension | uppercase }}</span>
                                       </div>
                                       <div class="flex flex-col overflow-hidden">
                                           <span class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate" title="{{file.name}}">{{ file.name }}</span>
                                           <span class="text-[10px] text-gray-400 truncate" title="{{file.path}}">{{ file.path }}</span>
                                       </div>
                                       <span class="text-xs text-gray-400 flex-shrink-0 ml-2 whitespace-nowrap">{{ formatSize(file.size) }}</span>
                                   </div>
                                   <div class="opacity-0 group-hover:opacity-100 transition flex gap-1 flex-shrink-0">
                                       <button (click)="downloadAttachment(file)" class="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 rounded" title="Download">
                                           <lucide-icon name="download" class="h-4 w-4"></lucide-icon>
                                       </button>
                                       <button (click)="removeAttachment(file.id)" class="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded" title="Remove">
                                           <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                                       </button>
                                   </div>
                               </div>
                           }
                      </div>

                      <!-- File Search -->
                       <div class="relative">
                          <div class="flex items-center gap-2 mb-2">
                              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Search files to attach...">
                          </div>
                          
                          <!-- Search Results Dropdown -->
                          <div *ngIf="searchResults().length > 0 || isSearchingAttachments()" class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                              
                              <div *ngIf="isSearchingAttachments()" class="p-4 flex justify-center items-center text-gray-500 dark:text-gray-400 gap-2">
                                  <lucide-icon name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
                                  <span class="text-xs">Searching files...</span>
                              </div>

                              @for (result of searchResults(); track result.id) {
                                  <div (mousedown)="attachFile(result)" class="flex items-center px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group border-b border-gray-50 dark:border-gray-700 last:border-0">
                                      <!-- Icon -->
                                      <div class="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mr-3">
                                          <lucide-icon [name]="result.type === 'folder' ? 'folder' : 'file'" class="h-4 w-4 text-gray-500 dark:text-gray-400"></lucide-icon>
                                      </div>
                                      
                                      <!-- Text -->
                                      <div class="flex-1 min-w-0">
                                          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" [title]="result.name">{{ result.name }}</p>
                                          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ result.ownerName || 'Me' }}</p>
                                      </div>

                                      <!-- Metadata (Date) -->
                                      <div class="ml-4 text-xs text-gray-400 shrink-0 hidden sm:block">
                                          {{ result.lastModified | date:'shortDate' }}
                                      </div>

                                        <!-- Action -->
                                      <div class="ml-2 opacity-0 group-hover:opacity-100 transition">
                                           <lucide-icon name="plus" class="h-4 w-4 text-blue-500"></lucide-icon>
                                      </div>
                                  </div>
                              }
                          </div>
                       </div>
                  </div>
              </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
           <button (click)="close()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition font-medium">
               {{ viewMode === 'comments' ? 'Close' : 'Cancel' }}
           </button>
           <button *ngIf="viewMode !== 'comments'" (click)="save()" [disabled]="!isValid() || isSaving()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <lucide-icon *ngIf="isSaving()" name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
              {{ isSaving() ? 'Saving...' : (viewMode === 'edit' ? 'Update Task' : 'Create Task') }}
           </button>
        </div>

      </div>
    </div>
  `
})
export class TaskModalComponent {
  @Output() onSave = new EventEmitter<void>();

  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private fileService = inject(FileSystemService);

  isOpen = signal(false);
  users = signal<User[]>([]);
  comments = signal<any[]>([]);
  attachments = signal<any[]>([]);
  searchResults = signal<FileSystemItem[]>([]);
  isSearchingAttachments = signal(false);

  isSaving = signal(false);
  viewMode: 'create' | 'edit' | 'comments' = 'create';

  editingTaskId: string | null = null;
  newComment = '';
  searchQuery = '';
  private searchSubject = new Subject<string>();

  title = '';
  description = '';
  priority: 'Low' | 'Medium' | 'High' = 'Medium';
  dueDate = '';
  assignedToIds: string[] = []; // Changed to array

  constructor() {
    this.authService.getUsers().subscribe(u => this.users.set(u));

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (!query.trim()) {
        this.searchResults.set([]);
        return;
      }
      this.isSearchingAttachments.set(true);
      this.fileService.searchFiles(query)
        .pipe(finalize(() => this.isSearchingAttachments.set(false)))
        .subscribe((results: FileSystemItem[]) => {
          this.searchResults.set(results.filter((f: FileSystemItem) => f.type !== 'folder')); // Only allow attaching files
        });
    });
  }

  open(mode: 'create' | 'edit' | 'comments', task?: Task) {
    this.reset();
    this.viewMode = mode;

    if (task) {
      this.editingTaskId = task.id;
      this.title = task.title;
      this.description = task.description;
      this.priority = task.priority;
      this.dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';

      // Load assignees
      if (task.assignees && task.assignees.length > 0) {
        this.assignedToIds = task.assignees.map(a => a.id);
      } else {
        // Fallback to legacy
        this.assignedToIds = task.assignedToUserId ? [task.assignedToUserId] : [];
      }

      if (mode === 'comments') {
        this.loadComments();
        this.loadAttachments();
      }
    } else {
      // Create mode defaults
      const me = this.authService.currentUser();
      if (me) this.assignedToIds = [me.id];
    }

    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  getHeaderTitle() {
    switch (this.viewMode) {
      case 'create': return 'New Task';
      case 'edit': return 'Edit Task';
      case 'comments': return 'Comments';
      default: return 'Task';
    }
  }

  getHeaderIcon() {
    return this.viewMode === 'comments' ? 'message-square' : 'check-square';
  }

  getUserName(userId: string) {
    return this.users().find(u => u.id === userId)?.name || 'Unknown';
  }

  reset() {
    this.title = '';
    this.description = '';
    this.priority = 'Medium';
    this.dueDate = '';
    this.assignedToIds = [];
    this.newComment = '';
    this.searchQuery = '';
    this.comments.set([]);
    this.attachments.set([]);
    this.searchResults.set([]);
    this.editingTaskId = null;
  }

  isAssigned(userId: string): boolean {
    return this.assignedToIds.includes(userId);
  }

  toggleAssignee(userId: string) {
    if (this.isAssigned(userId)) {
      this.assignedToIds = this.assignedToIds.filter(id => id !== userId);
    } else {
      this.assignedToIds.push(userId);
    }
  }

  isValid() {
    return this.title.trim().length > 0 && this.assignedToIds.length > 0;
  }

  loadComments() {
    if (this.editingTaskId) {
      this.taskService.getComments(this.editingTaskId).subscribe(c => this.comments.set(c));
    }
  }

  loadAttachments() {
    if (this.editingTaskId) {
      this.taskService.getAttachments(this.editingTaskId).subscribe(a => this.attachments.set(a));
    }
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  attachFile(file: FileSystemItem) {
    if (!this.editingTaskId) return;

    this.taskService.attachFile(this.editingTaskId, file.id).subscribe({
      next: () => {
        this.loadAttachments();
        this.searchQuery = '';
        this.searchResults.set([]);
      },
      error: (err) => {
        if (err.status === 409) {
          alert("File already attached.");
        }
      }
    });
  }

  removeAttachment(attachmentId: string) {
    this.taskService.removeAttachment(attachmentId).subscribe(() => {
      this.loadAttachments();
    });
  }

  downloadAttachment(file: any) {
    // Create a mock FileSystemItem for the service
    const item: FileSystemItem = {
      id: file.fileId,
      name: file.name,
      type: 'unknown',
      lastModified: new Date(),
      ownerId: '',
      sharedWith: [],
      url: file.url,
      parentId: null
    };
    this.fileService.downloadFile(item);
  }

  formatSize(bytes: any): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  addComment() {
    if (!this.newComment.trim() || !this.editingTaskId) return;

    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    this.taskService.addComment(this.editingTaskId, userId, this.newComment).subscribe(() => {
      this.newComment = '';
      this.loadComments();
    });
  }

  save() {
    if (!this.isValid() || this.isSaving()) return;

    this.isSaving.set(true);

    const payload: any = {
      title: this.title,
      description: this.description,
      priority: this.priority,
      dueDate: this.dueDate || undefined,
      assignedToUserIds: this.assignedToIds, // Send array
      createdByUserId: this.authService.currentUser()!.id
    };

    const finalize = () => {
      this.isSaving.set(false);
      this.close();
      this.onSave.emit();
    };

    if (this.viewMode === 'edit' && this.editingTaskId) {
      payload.id = this.editingTaskId;
      this.taskService.updateTask(payload).subscribe({
        next: finalize,
        error: () => this.isSaving.set(false)
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: finalize,
        error: () => this.isSaving.set(false)
      });
    }
  }
}


