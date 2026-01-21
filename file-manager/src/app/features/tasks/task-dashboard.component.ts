import { Component, OnInit, inject, signal, ViewChild, computed, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';
import { IconsModule } from '../../core/modules/icons.module';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TaskModalComponent } from './task-modal.component';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-task-dashboard',
    standalone: true,
    imports: [CommonModule, IconsModule, TaskModalComponent, FormsModule, DragDropModule],
    template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <div class="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <lucide-icon name="check-square" class="h-6 w-6 text-blue-600"></lucide-icon>
            Tasks
            </h1>
            <label *ngIf="authService.currentUser()?.role === 'admin'" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none border-l border-gray-200 dark:border-gray-700 pl-4">
                <input type="checkbox" [checked]="showArchived()" (change)="toggleArchived()" class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700">
                Show Archived
            </label>
        </div>

        <!-- Filters -->
         <div class="flex flex-wrap items-center gap-3">
             <div class="flex items-center gap-2">
                 <lucide-icon name="filter" class="h-4 w-4 text-gray-400"></lucide-icon>
                 <span class="text-sm font-medium text-gray-600">Filters:</span>
             </div>

             <!-- Priority Filter -->
             <select [ngModel]="filterPriority()" (ngModelChange)="filterPriority.set($event)" class="text-sm border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-2 pr-8 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                 <option value="All">All Priorities</option>
                 <option value="High">High</option>
                 <option value="Medium">Medium</option>
                 <option value="Low">Low</option>
             </select>

             <!-- Due Date Filter -->
             <select [ngModel]="filterDueDate()" (ngModelChange)="filterDueDate.set($event)" class="text-sm border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-2 pr-8 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                 <option value="All">All Dates</option>
                 <option value="Today">Due Today</option>
                 <option value="This Week">Due This Week</option>
                 <option value="Overdue">Overdue</option>
                 <option value="No Date">No Due Date</option>
             </select>

             <!-- User Filter -->
             <select [ngModel]="filterAssignee()" (ngModelChange)="filterAssignee.set($event)" class="text-sm border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-2 pr-8 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 max-w-[150px]">
                 <option value="All">All Users</option>
                 @for(user of users(); track user.id) {
                     <option [value]="user.id">{{ user.name }}</option>
                 }
             </select>
             
             <!-- Reset -->
             <button *ngIf="filterPriority() !== 'All' || filterDueDate() !== 'All' || filterAssignee() !== 'All'" 
                     (click)="filterPriority.set('All'); filterDueDate.set('All'); filterAssignee.set('All')"
                     class="text-xs text-red-500 hover:text-red-700 font-medium px-2">
                 Reset
             </button>

             <div class="h-6 w-px bg-gray-200 mx-2 hidden xl:block"></div>

            <button *ngIf="authService.currentUser()?.role === 'admin'" (click)="openCreateModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition shadow-sm whitespace-nowrap">
              <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
              Add Task
            </button>
         </div>
      </div>

      <!-- Kanban Board -->
      <div class="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div class="flex h-full gap-6 min-w-[1000px]" cdkDropListGroup>
          
          <!-- Pending Column -->
          <div class="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800/50 rounded-xl min-w-[300px]">
             <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl">
                <span class="font-semibold text-gray-700 dark:text-gray-200">To Do</span>
                <span class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">{{ pendingTasks().length }}</span>
             </div>
             <div class="flex-1 p-4 overflow-y-auto space-y-3"
                  cdkDropList id="Pending" [cdkDropListData]="pendingTasks()"
                  (cdkDropListDropped)="drop($event)">
                @for (task of pendingTasks(); track task.id) {
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition group relative flex flex-col cursor-move"
                         cdkDrag [cdkDragData]="task">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded" 
                                  [ngClass]="getPriorityClass(task.priority)">{{ task.priority }}</span>
                            
                            <div class="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition">
                                <button (click)="openCommentsModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500" title="Comments">
                                    <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button *ngIf="canEdit(task)" (click)="openEditModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Edit">
                                    <lucide-icon name="edit-3" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button (click)="moveTask(task, 'In Progress')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400" title="Move to In Progress">
                                    <lucide-icon name="chevron-right" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button *ngIf="canDelete(task)" (click)="deleteTask(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400" title="Delete">
                                    <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                                </button>
                            </div>
                        </div>
                        <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-1 cursor-pointer" (click)="openCommentsModal(task)">{{ task.title }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3" title="{{task.description}}">{{ task.description | slice:0:300 }}{{ task.description.length > 300 ? '...' : '' }}</p>
                        
                        <div class="mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
                             <div class="flex -space-x-2 overflow-hidden">
                                @if (task.assignees && task.assignees.length > 0) {
                                    @for (assignee of task.assignees.slice(0, 3); track assignee.id) {
                                        <div class="h-6 w-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 font-bold text-[10px]" title="{{assignee.name}}">
                                            {{ assignee.name.charAt(0).toUpperCase() }}
                                        </div>
                                    }
                                    @if (task.assignees.length > 3) {
                                        <div class="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 font-bold text-[10px]">
                                            +{{ task.assignees.length - 3 }}
                                        </div>
                                    }
                                }
                             </div>
                             
                             <div class="flex items-center gap-2">
                                 @if(task.dueDate) {
                                     <span class="flex items-center gap-1" [class.text-red-500]="isOverdue(task.dueDate)">
                                         <lucide-icon name="clock" class="h-3 w-3"></lucide-icon>
                                         {{ task.dueDate | date:'dd/MM/yyyy' }}
                                     </span>
                                 }
                             </div>
                        </div>
                    </div>
                }
             </div>
          </div>

          <!-- In Progress Column -->
          <div class="flex-1 flex flex-col bg-blue-50/50 dark:bg-gray-800/50 rounded-xl min-w-[300px]">
             <div class="p-4 border-b border-blue-100 dark:border-gray-700 flex justify-between items-center bg-blue-50 dark:bg-gray-800 rounded-t-xl">
                <span class="font-semibold text-blue-700 dark:text-blue-400">In Progress</span>
                <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full">{{ inProgressTasks().length }}</span>
             </div>
             <div class="flex-1 p-4 overflow-y-auto space-y-3"
                  cdkDropList id="In Progress" [cdkDropListData]="inProgressTasks()"
                  (cdkDropListDropped)="drop($event)">
                 @for (task of inProgressTasks(); track task.id) {
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-blue-100 dark:border-gray-700 hover:shadow-md transition group relative flex flex-col cursor-move"
                         cdkDrag [cdkDragData]="task">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded" 
                                  [ngClass]="getPriorityClass(task.priority)">{{ task.priority }}</span>
                            
                            <div class="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition">
                                <button (click)="openCommentsModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500" title="Comments">
                                    <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button *ngIf="canEdit(task)" (click)="openEditModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Edit">
                                    <lucide-icon name="edit-3" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button (click)="moveTask(task, 'Pending')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Move Back">
                                    <lucide-icon name="arrow-left" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button (click)="moveTask(task, 'Review')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-purple-600 dark:text-purple-400" title="Move to Review">
                                    <lucide-icon name="chevron-right" class="h-4 w-4"></lucide-icon>
                                </button>
                            </div>
                        </div>
                        <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-1 cursor-pointer" (click)="openCommentsModal(task)">{{ task.title }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3" title="{{task.description}}">{{ task.description | slice:0:300 }}{{ task.description.length > 300 ? '...' : '' }}</p>
                        
                        <div class="mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
                             <div class="flex -space-x-2 overflow-hidden">
                                @if (task.assignees && task.assignees.length > 0) {
                                    @for (assignee of task.assignees.slice(0, 3); track assignee.id) {
                                        <div class="h-6 w-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 font-bold text-[10px]" title="{{assignee.name}}">
                                            {{ assignee.name.charAt(0).toUpperCase() }}
                                        </div>
                                    }
                                }
                             </div>
                             <div class="flex items-center gap-2">
                                 @if(task.dueDate) {
                                     <span class="flex items-center gap-1" [class.text-red-500]="isOverdue(task.dueDate)">
                                         <lucide-icon name="clock" class="h-3 w-3"></lucide-icon>
                                         {{ task.dueDate | date:'dd/MM/yyyy' }}
                                     </span>
                                 }
                             </div>
                        </div>
                    </div>
                }
             </div>
          </div>

          <!-- Review Column -->
          <div class="flex-1 flex flex-col bg-purple-50/50 dark:bg-gray-800/50 rounded-xl min-w-[300px]">
             <div class="p-4 border-b border-purple-100 dark:border-gray-700 flex justify-between items-center bg-purple-50 dark:bg-gray-800 rounded-t-xl">
                <span class="font-semibold text-purple-700 dark:text-purple-400">Review</span>
                <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded-full">{{ reviewTasks().length }}</span>
             </div>
             <div class="flex-1 p-4 overflow-y-auto space-y-3"
                  cdkDropList id="Review" [cdkDropListData]="reviewTasks()"
                  (cdkDropListDropped)="drop($event)">
                 @for (task of reviewTasks(); track task.id) {
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-purple-100 dark:border-gray-700 hover:shadow-md transition group relative flex flex-col cursor-move"
                         cdkDrag [cdkDragData]="task">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded" 
                                  [ngClass]="getPriorityClass(task.priority)">{{ task.priority }}</span>
                            
                            <div class="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition">
                                <button (click)="openCommentsModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500" title="Comments">
                                    <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button *ngIf="canEdit(task)" (click)="openEditModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Edit">
                                    <lucide-icon name="edit-3" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button (click)="moveTask(task, 'In Progress')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Move Back">
                                    <lucide-icon name="arrow-left" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button *ngIf="canEdit(task)" (click)="moveTask(task, 'Done')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-green-600 dark:text-green-400" title="Complete Task">
                                    <lucide-icon name="check" class="h-4 w-4"></lucide-icon>
                                </button>
                            </div>
                        </div>
                        <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-1 cursor-pointer" (click)="openCommentsModal(task)">{{ task.title }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3" title="{{task.description}}">{{ task.description | slice:0:300 }}{{ task.description.length > 300 ? '...' : '' }}</p>
                        
                        <div class="mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
                             <div class="flex -space-x-2 overflow-hidden">
                                @if (task.assignees && task.assignees.length > 0) {
                                    @for (assignee of task.assignees.slice(0, 3); track assignee.id) {
                                        <div class="h-6 w-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 font-bold text-[10px]" title="{{assignee.name}}">
                                            {{ assignee.name.charAt(0).toUpperCase() }}
                                        </div>
                                    }
                                }
                             </div>
                             <div class="flex items-center gap-2">
                                 @if(task.dueDate) {
                                     <span class="flex items-center gap-1" [class.text-red-500]="isOverdue(task.dueDate)">
                                         <lucide-icon name="clock" class="h-3 w-3"></lucide-icon>
                                         {{ task.dueDate | date:'dd/MM/yyyy' }}
                                     </span>
                                 }
                             </div>
                        </div>
                    </div>
                }
             </div>
          </div>

          <!-- Done Column (Renamed logic from Completed) -->
          <div class="flex-1 flex flex-col bg-green-50/50 dark:bg-gray-800/50 rounded-xl min-w-[300px]">
             <div class="p-4 border-b border-green-100 dark:border-gray-700 flex justify-between items-center bg-green-50 dark:bg-gray-800 rounded-t-xl">
                <span class="font-semibold text-green-700 dark:text-green-400">Done</span>
                <span class="bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full">{{ doneTasks().length }}</span>
             </div>
             <div class="flex-1 p-4 overflow-y-auto space-y-3"
                  cdkDropList id="Done" [cdkDropListData]="doneTasks()"
                  (cdkDropListDropped)="drop($event)">
                @for (task of doneTasks(); track task.id) {
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-green-100 dark:border-gray-700 hover:shadow-md transition opacity-75 hover:opacity-100 group relative cursor-move"
                         cdkDrag [cdkDragData]="task">
                         <div class="flex justify-between items-start mb-2">
                            <span class="text-xs font-semibold px-2 py-0.5 rounded" 
                                  [ngClass]="getPriorityClass(task.priority)">{{ task.priority }}</span>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button (click)="openCommentsModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500" title="Comments">
                                    <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button *ngIf="canDelete(task)" (click)="deleteTask(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400" title="Delete">
                                    <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                                </button>
                                <button *ngIf="canEdit(task)" (click)="moveTask(task, 'Review')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400" title="Reopen to Review">
                                    <lucide-icon name="rotate-ccw" class="h-4 w-4"></lucide-icon>
                                </button>
                            </div>
                         </div>
                        <h3 class="font-medium text-gray-800 dark:text-gray-200 line-through text-gray-500 dark:text-gray-500">{{ task.title }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{{ task.description }}</p>
                        <p class="text-xs text-gray-400 mt-1">Completed on {{ (task.completedAt || task.updatedAt || task.createdAt) | date:'dd/MM/yyyy' }}</p>
                    </div>
                }
             </div>
          </div>
        </div>
      </div>

      <app-task-modal #taskModal (onSave)="loadTasks()"></app-task-modal>
    </div>
  `
})
export class TaskDashboardComponent implements OnInit {
    private taskService = inject(TaskService);
    public authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    tasks = signal<Task[]>([]);
    showArchived = signal(false);
    users = signal<any[]>([]); // To store available users for filter

    // Filters
    filterPriority = signal<string>('All');
    filterAssignee = signal<string>('All');
    filterDueDate = signal<string>('All');

    @ViewChild('taskModal') taskModal!: TaskModalComponent;

    // Column Signals (Writable to allow CDK manipulation)
    // Column Signals (Writable to allow CDK manipulation)
    pendingTasks = signal<Task[]>([]);
    inProgressTasks = signal<Task[]>([]);
    reviewTasks = signal<Task[]>([]);
    doneTasks = signal<Task[]>([]);

    constructor() {
        // Effect to reorganize tasks when filters change
        effect(() => {
            // Read signals to track dependencies
            this.tasks();
            this.filterPriority();
            this.filterAssignee();
            this.filterDueDate();

            // Re-organize (untracked to avoid loops if we were setting tasks, but here we set cols)
            this.organizeTasks();
        }, { allowSignalWrites: true });
    }

    ngOnInit() {
        this.loadTasks();
        this.loadUsers();

        this.route.queryParams.subscribe(params => {
            const openId = params['openTaskId'];
            if (openId) {
                this.checkAndOpenTask(openId);
            }

            const action = params['action'];
            if (action === 'create') {
                this.openCreateModal();
                this.router.navigate([], {
                    queryParams: { action: null },
                    queryParamsHandling: 'merge',
                    replaceUrl: true
                });
            }
        });
    }

    loadUsers() {
        this.authService.getUsers().subscribe(u => this.users.set(u));
    }

    loadTasks() {
        this.taskService.getTasks(this.showArchived()).subscribe(tasks => {
            this.tasks.set(tasks);
            // organizeTasks will be called by effect since tasks() changed

            const openId = this.route.snapshot.queryParams['openTaskId'];
            if (openId) {
                this.checkAndOpenTask(openId);
            }

            const action = this.route.snapshot.queryParams['action'];
            if (action === 'create') {
                setTimeout(() => {
                    this.openCreateModal();
                    this.router.navigate([], {
                        queryParams: { action: null },
                        queryParamsHandling: 'merge',
                        replaceUrl: true
                    });
                }, 100);
            }
        });
    }

    // Manual organization instead of computed
    organizeTasks() {
        const allTasks = this.tasks();
        const filtered = this.filterTasks(allTasks);

        this.pendingTasks.set(this.sortTasks(filtered.filter(t => t.status === 'Pending')));
        this.inProgressTasks.set(this.sortTasks(filtered.filter(t => t.status === 'In Progress')));
        this.reviewTasks.set(this.sortTasks(filtered.filter(t => t.status === 'Review')));
        this.doneTasks.set(this.sortTasks(filtered.filter(t => t.status === 'Done')));
    }

    filterTasks(tasks: Task[]) {
        return tasks.filter(task => {
            // Priority Filter
            if (this.filterPriority() !== 'All' && task.priority !== this.filterPriority()) return false;

            // Assignee Filter
            if (this.filterAssignee() !== 'All') {
                const hasAssignee = task.assignees?.some(a => a.id === this.filterAssignee());
                if (!hasAssignee && task.assignedToUserId !== this.filterAssignee()) return false;
            }

            // Due Date Filter
            if (this.filterDueDate() !== 'All') {
                if (!task.dueDate) return this.filterDueDate() === 'No Date';

                const taskDate = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const taskDateZero = new Date(taskDate);
                taskDateZero.setHours(0, 0, 0, 0);

                if (this.filterDueDate() === 'Overdue') {
                    if (taskDateZero >= today) return false;
                } else if (this.filterDueDate() === 'Today') {
                    if (taskDateZero.getTime() !== today.getTime()) return false;
                } else if (this.filterDueDate() === 'This Week') {
                    const dayDiff = (taskDateZero.getTime() - today.getTime()) / (1000 * 3600 * 24);
                    if (dayDiff < 0 || dayDiff > 7) return false;
                } else if (this.filterDueDate() === 'No Date') {
                    return false;
                }
            }
            return true;
        });
    }

    // Helper for sorting
    private sortTasks(tasks: Task[]) {
        const priorityOrder: { [key: string]: number } = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return [...tasks].sort((a, b) => {
            const pA = priorityOrder[a.priority] || 0;
            const pB = priorityOrder[b.priority] || 0;
            return pB - pA;
        });
    }

    checkAndOpenTask(openId: string) {
        if (!openId || this.tasks().length === 0) return;

        const task = this.tasks().find(t => t.id == openId || t.id == openId.toUpperCase());
        if (task) {
            setTimeout(() => {
                this.taskModal.open('comments', task);
                this.router.navigate([], {
                    queryParams: { openTaskId: null, t: null },
                    queryParamsHandling: 'merge',
                    replaceUrl: true
                });
            }, 100);
        }
    }

    toggleArchived() {
        this.showArchived.update(v => !v);
        this.loadTasks();
    }

    isAdmin() {
        return this.authService.currentUser()?.role === 'admin';
    }

    getPriorityClass(priority: string) {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700';
            case 'Medium': return 'bg-yellow-100 text-yellow-700';
            case 'Low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    isOverdue(date: Date) {
        return new Date(date) < new Date() && new Date(date).getDate() !== new Date().getDate();
    }

    moveTask(task: Task, newStatus: string) {
        this.taskService.updateStatus(task.id, newStatus).subscribe(() => {
            this.loadTasks();
        });
    }

    deleteTask(task: Task) {
        Swal.fire({
            title: 'Delete Task?',
            text: 'This cannot be undone',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d33'
        }).then((res) => {
            if (res.isConfirmed) {
                this.taskService.deleteTask(task.id).subscribe(() => {
                    this.loadTasks();
                });
            }
        });
    }

    canEdit(task: Task) {
        const user = this.authService.currentUser();
        if (!user) return false;
        return user.role === 'admin' || user.id === task.createdByUserId || task.assignees?.some(a => a.id === user.id) || task.assignedToUserId === user.id;
    }

    canDelete(task: Task) {
        const user = this.authService.currentUser();
        if (!user) return false;
        return user.role === 'admin' || user.id === task.createdByUserId;
    }

    openCreateModal() {
        this.taskModal.open('create'); // Open empty for create
    }

    openEditModal(task: Task) {
        this.taskModal.open('edit', task); // Pass task for edit
    }

    openCommentsModal(task: Task) {
        this.taskModal.open('comments', task);
    }

    drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            // We need to update the signal to reflect the reordering
            this.updateColumnSignal(event.container.id, [...event.container.data]);
        } else {
            // To prevent crash: Transfer the item in a new array copy FIRST
            const prevData = [...event.previousContainer.data];
            const currData = [...event.container.data];

            transferArrayItem(
                prevData,
                currData,
                event.previousIndex,
                event.currentIndex,
            );

            // Update signals with NEW arrays containing the transferred item
            this.updateColumnSignal(event.previousContainer.id, prevData);
            this.updateColumnSignal(event.container.id, currData);

            const task = event.item.data as Task;
            const newStatus = event.container.id as any;

            // Update the task status in the master list silently or via API
            // Do NOT update this.tasks() here manually. Wait for API reload.
            this.taskService.updateStatus(task.id, newStatus).subscribe({
                next: () => {
                    this.loadTasks(); // Reload to ensure consistency
                },
                error: (err) => {
                    console.error('Update failed', err);
                    this.loadTasks(); // Revert on error
                }
            });
        }
    }

    private updateColumnSignal(columnId: string, data: Task[]) {
        switch (columnId) {
            case 'Pending': this.pendingTasks.set(data); break;
            case 'In Progress': this.inProgressTasks.set(data); break;
            case 'Review': this.reviewTasks.set(data); break;
            case 'Done': this.doneTasks.set(data); break;
        }
    }
}
