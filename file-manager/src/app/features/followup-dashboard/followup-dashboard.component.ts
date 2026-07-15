import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { Application } from '../../core/models/application.model';
import { Followup } from '../../core/models/followup.model';
import { ToastService } from '../../core/services/toast.service';
import { IconsModule } from '../../core/modules/icons.module';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AuthService } from '../../core/services/auth.service';
import { FileSystemService } from '../../core/services/file-system.service';
import { FileSystemItem } from '../../core/models/file-system.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-followup-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule, DragDropModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Followup Board</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Kanban board displaying tasks assigned to you</p>
        </div>
      </div>

      <!-- Kanban View -->
      <div class="overflow-x-auto min-h-[600px] pb-6 animate-in fade-in duration-200">
        <div class="flex gap-6 min-w-[1200px]" cdkDropListGroup>
          <!-- Dynamic Followup sections columns -->
          <div *ngFor="let col of followups()" class="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/50 rounded-xl min-w-[300px] max-h-[70vh]">
            <!-- Column Header -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl shrink-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-gray-700 dark:text-gray-200 text-sm">{{ col.name }}</span>
                <span *ngIf="col.isDefault" class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                  Default
                </span>
              </div>
              <span class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {{ getApplicationsForFollowup(col.id!).length }}
              </span>
            </div>

            <!-- Column Body -->
            <div class="flex-1 p-4 overflow-y-auto space-y-3 min-h-[350px] custom-scrollbar"
                 cdkDropList [id]="'followup-' + col.id" [cdkDropListData]="getApplicationsForFollowup(col.id!)"
                 (cdkDropListDropped)="onDrop($event)">
              
              <div *ngFor="let app of getApplicationsForFollowup(col.id!)" cdkDrag [cdkDragData]="app"
                   class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 hover:shadow-md transition duration-200 group relative flex flex-col cursor-move">
                
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {{ app.visitingDate | date:'dd/MM/yyyy' }}
                  </span>
                  
                  <div class="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition duration-150">
                    <button (click)="openCommentsModal(app)" class="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Discussion">
                      <lucide-icon name="message-square" class="h-3.5 w-3.5"></lucide-icon>
                    </button>
                  </div>
                </div>

                <h3 (click)="openCommentsModal(app)" class="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1 hover:text-blue-600 cursor-pointer" title="View details, comments & attachments">{{ app.visitorName }}</h3>
                
                <p class="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <lucide-icon name="phone" class="h-3 w-3 text-gray-400"></lucide-icon>
                  {{ app.mobileNo }}
                </p>
                
                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mb-3 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-lg" title="{{app.description}}">
                  {{ app.description }}
                </p>

                <div class="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  <span class="flex items-center gap-1">
                    <lucide-icon name="map-pin" class="h-2.5 w-2.5"></lucide-icon>
                    {{ app.villageName }}
                  </span>

                  <!-- Assignees Avatars -->
                  <div class="flex -space-x-1.5 overflow-hidden">
                    <ng-container *ngIf="app.assignees && app.assignees.length > 0">
                      <div *ngFor="let assignee of app.assignees.slice(0, 3)" class="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-white dark:border-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-[8px] select-none" title="{{assignee.name}}">
                        {{ assignee.name.charAt(0).toUpperCase() }}
                      </div>
                      <div *ngIf="app.assignees.length > 3" class="h-5 w-5 rounded-full bg-gray-100 dark:bg-gray-700 border border-white dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-[8px] select-none">
                        +{{ app.assignees.length - 3 }}
                      </div>
                    </ng-container>
                  </div>
                </div>
              </div>

              <!-- Empty State in Column -->
              <div *ngIf="getApplicationsForFollowup(col.id!).length === 0" class="h-24 border border-dashed border-gray-200 dark:border-gray-700/60 rounded-xl flex items-center justify-center text-gray-400 text-xs italic">
                Drag tasks here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments / Details View Modal -->
    <div *ngIf="isCommentsModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeCommentsModal()"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <lucide-icon name="message-square" class="h-5 w-5 text-blue-600"></lucide-icon>
            Task details & Comments
          </h3>
          <button (click)="closeCommentsModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <!-- Application Details Card -->
          <div *ngIf="activeCommentsApplication() as app" class="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-lg border border-gray-100 dark:border-gray-600 space-y-4">
            <div>
              <h4 class="font-bold text-gray-800 dark:text-gray-200 text-lg flex items-center justify-between">
                <span>{{ app.visitorName }}</span>
                <span *ngIf="app.followupName" class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400">
                  {{ app.followupName }}
                </span>
              </h4>
              <p class="text-gray-600 dark:text-gray-400 text-sm mt-2 whitespace-pre-line">{{ app.description || 'No description provided.' }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200/50 dark:border-gray-600/50 pt-3">
              <div class="flex items-center gap-2">
                <lucide-icon name="phone" class="h-4 w-4 text-gray-400"></lucide-icon>
                <span>{{ app.mobileNo || 'N/A' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <lucide-icon name="map-pin" class="h-4 w-4 text-gray-400"></lucide-icon>
                <span>{{ app.villageName }} > {{ app.talukaName }} > {{ app.districtName }}</span>
              </div>
              <div class="flex items-center gap-2">
                <lucide-icon name="calendar" class="h-4 w-4 text-gray-400"></lucide-icon>
                <span>Due Date: {{ app.visitingDate | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <lucide-icon name="hard-drive" class="h-4 w-4 text-gray-400"></lucide-icon>
                <span>Channel: {{ app.channelName || 'Unassigned' }}</span>
              </div>
            </div>

            <div *ngIf="app.reference" class="border-t border-gray-200/50 dark:border-gray-600/50 pt-3 text-xs">
              <span class="font-bold text-gray-600 dark:text-gray-300 block mb-1">Reference:</span>
              <p class="text-gray-600 dark:text-gray-400 whitespace-pre-line">{{ app.reference }}</p>
            </div>

            <div class="border-t border-gray-200/50 dark:border-gray-600/50 pt-3">
              <span class="font-bold text-xs text-gray-600 dark:text-gray-300 block mb-2">Assignees:</span>
              <div class="flex flex-wrap gap-2">
                @for (assignee of app.assignees; track assignee.id) {
                  <span class="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-1 rounded-md text-xs text-gray-700 dark:text-gray-300">
                    <span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                    {{ assignee.name }}
                  </span>
                }
                <span *ngIf="!app.assignees || app.assignees.length === 0" class="text-gray-400 text-xs italic">No assignees</span>
              </div>
            </div>
          </div>

          <!-- Discussion Section -->
          <div class="space-y-4">
            <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
              Discussion
            </h5>
            
            <!-- Comments List -->
            <div class="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
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
          </div>

          <!-- Attachments Section -->
          <div class="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h4 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <lucide-icon name="paperclip" class="h-4 w-4 text-gray-500 dark:text-gray-400"></lucide-icon>
              Attachments ({{ attachments().length }})
            </h4>

            <!-- Attachments List -->
            <div class="space-y-2 mb-4 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
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
                <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Search files to attach...">
              </div>
              
              <!-- Search Results Dropdown -->
              <div *ngIf="searchResults().length > 0 || isSearchingAttachments()" class="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                <div *ngIf="isSearchingAttachments()" class="p-4 flex justify-center items-center text-gray-500 dark:text-gray-400 gap-2">
                  <lucide-icon name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
                  <span class="text-xs">Searching files...</span>
                </div>

                @for (result of searchResults(); track result.id) {
                  <div (mousedown)="attachFile(result)" class="flex items-center px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div class="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mr-3">
                      <lucide-icon [name]="result.type === 'folder' ? 'folder' : 'file'" class="h-4 w-4 text-gray-500 dark:text-gray-400"></lucide-icon>
                    </div>
                    
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" [title]="result.name">{{ result.name }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ result.ownerName || 'Me' }}</p>
                    </div>

                    <div class="ml-4 text-xs text-gray-400 shrink-0 hidden sm:block">
                      {{ result.lastModified | date:'shortDate' }}
                    </div>

                    <div class="ml-2 opacity-0 group-hover:opacity-100 transition">
                      <lucide-icon name="plus" class="h-4 w-4 text-blue-500"></lucide-icon>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button (click)="closeCommentsModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition font-medium">
            Close
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .cdk-drag-preview {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      background: white;
      width: 280px;
    }
    .cdk-drag-placeholder {
      opacity: 0.35;
      border: 2px dashed #3b82f6 !important;
      background: rgba(59, 130, 246, 0.05) !important;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #475569;
    }
  `]
})
export class FollowupDashboardComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private fileService = inject(FileSystemService);

  applications = signal<Application[]>([]);
  followups = signal<Followup[]>([]);

  // Comments and Attachments Modal
  isCommentsModalOpen = signal<boolean>(false);
  activeCommentsApplication = signal<Application | null>(null);
  comments = signal<any[]>([]);
  attachments = signal<any[]>([]);
  newComment = '';
  searchQuery = '';
  searchResults = signal<FileSystemItem[]>([]);
  isSearchingAttachments = signal(false);
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.loadApplications();
    this.loadFollowups();

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
          this.searchResults.set(results.filter((f: FileSystemItem) => f.type !== 'folder'));
        });
    });
  }

  loadApplications() {
    this.mastersService.getApplications().subscribe({
      next: (data) => this.applications.set(data),
      error: () => this.toast.show('Failed to load tasks', 'error')
    });
  }

  loadFollowups() {
    this.mastersService.getFollowups().subscribe({
      next: (data) => this.followups.set(data),
      error: () => this.toast.show('Failed to load followup steps', 'error')
    });
  }

  getApplicationsForFollowup(followupId: number): Application[] {
    const currentUserId = Number(this.authService.currentUser()?.id);
    const defaultCol = this.followups().find(f => f.isDefault) || this.followups()[0];
    const isDefaultCol = defaultCol && defaultCol.id === followupId;

    return this.applications().filter(a => {
      const isAssigned = a.assignees && a.assignees.some(u => Number(u.id) === currentUserId);
      if (!isAssigned) return false;
      if (a.isClosed) return false; // Hide closed/archived tasks from user followup board

      if (a.followupId === followupId) return true;
      if (!a.followupId && isDefaultCol) return true;
      return false;
    });
  }

  onDrop(event: CdkDragDrop<Application[]>) {
    if (event.previousContainer !== event.container) {
      const app = event.item.data as Application;
      const destFollowupIdStr = event.container.id.replace('followup-', '');
      const destFollowupId = destFollowupIdStr ? Number(destFollowupIdStr) : null;
      
      const currentApps = this.applications().map(a => {
        if (a.id === app.id) {
          return { ...a, followupId: destFollowupId };
        }
        return a;
      });
      this.applications.set(currentApps);
      
      this.mastersService.updateApplicationFollowup(app.id!, destFollowupId).subscribe({
        next: () => {
          this.toast.show('Task moved successfully');
          this.loadApplications();
        },
        error: () => {
          this.toast.show('Failed to move task', 'error');
          this.loadApplications(); // Revert back
        }
      });
    }
  }

  // Comments and Attachments Methods
  openCommentsModal(app: Application) {
    this.activeCommentsApplication.set(app);
    this.isCommentsModalOpen.set(true);
    this.loadComments(app.id!);
    this.loadAttachments(app.id!);
    this.newComment = '';
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  closeCommentsModal() {
    this.isCommentsModalOpen.set(false);
    this.activeCommentsApplication.set(null);
    this.comments.set([]);
    this.attachments.set([]);
  }

  loadComments(appId: number) {
    this.mastersService.getApplicationComments(appId).subscribe({
      next: (data) => this.comments.set(data),
      error: () => this.toast.show('Failed to load comments', 'error')
    });
  }

  addComment() {
    const app = this.activeCommentsApplication();
    const currentUser = this.authService.currentUser();
    if (!app || !currentUser || !this.newComment.trim()) return;

    this.mastersService.addApplicationComment(app.id!, currentUser.id, this.newComment.trim()).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments(app.id!);
      },
      error: () => this.toast.show('Failed to add comment', 'error')
    });
  }

  loadAttachments(appId: number) {
    this.mastersService.getApplicationAttachments(appId).subscribe({
      next: (data) => this.attachments.set(data),
      error: () => this.toast.show('Failed to load attachments', 'error')
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  attachFile(file: FileSystemItem) {
    const app = this.activeCommentsApplication();
    if (!app) return;

    this.mastersService.attachApplicationFile(app.id!, file.id).subscribe({
      next: () => {
        this.toast.show('File attached successfully');
        this.loadAttachments(app.id!);
        this.searchQuery = '';
        this.searchResults.set([]);
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Failed to attach file', 'error');
      }
    });
  }

  removeAttachment(attachmentId: string) {
    const app = this.activeCommentsApplication();
    if (!app) return;

    this.mastersService.removeApplicationAttachment(attachmentId).subscribe({
      next: () => {
        this.toast.show('Attachment removed');
        this.loadAttachments(app.id!);
      },
      error: () => this.toast.show('Failed to remove attachment', 'error')
    });
  }

  downloadAttachment(file: any) {
    window.open(`${environment.apiUrl}/files/download.php?id=${file.fileId}`, '_blank');
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
