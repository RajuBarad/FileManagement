import { Component, OnInit, inject, signal, effect, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';
import { IconsModule } from '../../core/modules/icons.module';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

export interface BoardSection {
    id: string;
    name: string;
    color: string;
    isCustom?: boolean;
    isCompletedSection?: boolean;
}

@Component({
    selector: 'app-task-dashboard',
    standalone: true,
    imports: [CommonModule, IconsModule, FormsModule, DragDropModule],
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

        <!-- Filters & Actions -->
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
             
             <!-- Reset Filters -->
             <button *ngIf="filterPriority() !== 'All' || filterDueDate() !== 'All' || filterAssignee() !== 'All'" 
                     (click)="filterPriority.set('All'); filterDueDate.set('All'); filterAssignee.set('All')"
                     class="text-xs text-red-500 hover:text-red-700 font-medium px-2">
                 Reset
             </button>

          </div>
       </div>

      <!-- Kanban Board -->
      <div class="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div class="flex h-full gap-6 min-w-[1000px]" cdkDropListGroup>
          
          @for (section of sections(); track section.id) {
             <!-- Dynamic Section Column -->
             <div class="flex-1 flex flex-col rounded-xl min-w-[300px]" [ngClass]="getSectionStyle(section.color).bg">
                <!-- Section Header -->
                <div class="p-4 border-b flex justify-between items-center rounded-t-xl" [ngClass]="[getSectionStyle(section.color).headerBg, getSectionStyle(section.color).border]">
                   <div class="flex items-center gap-1.5 min-w-0 pr-1">
                      <span class="font-semibold truncate" [ngClass]="getSectionStyle(section.color).text">{{ section.name }}</span>
                      <span *ngIf="section.isCompletedSection" class="flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0" title="Tasks moved to this section are marked as Completed">
                          <lucide-icon name="check-circle" class="h-3 w-3 text-emerald-600 dark:text-emerald-400"></lucide-icon>
                          Completed
                      </span>
                   </div>
                   <div class="flex items-center gap-1.5">
                      <span class="text-xs px-2 py-1 rounded-full font-medium" [ngClass]="getSectionStyle(section.color).badge">{{ getTasksForSection(section.id).length }}</span>
                      
                      <!-- Add Task to Section -->
                      <button (click)="openCreateModal(section.id)" class="p-1 rounded transition flex items-center gap-1 text-xs font-medium" [ngClass]="[getSectionStyle(section.color).btnHover, getSectionStyle(section.color).btnText]" title="Add Task to {{ section.name }}">
                         <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
                      </button>
                      
                      <!-- Change Section Background Color -->
                      <button *ngIf="isAdmin()" (click)="openChangeColorModal(section)" class="p-1 rounded transition flex items-center text-xs font-medium" [ngClass]="[getSectionStyle(section.color).btnHover, getSectionStyle(section.color).btnText]" title="Change Color for {{ section.name }}">
                         <lucide-icon name="palette" class="h-4 w-4"></lucide-icon>
                      </button>

                      <!-- Delete Section option -->
                      <button *ngIf="isAdmin()" (click)="deleteSection(section)" class="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition" title="Delete {{ section.name }} Section">
                         <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                      </button>
                   </div>
                </div>

                <!-- Cards List -->
                <div class="flex-1 p-4 overflow-y-auto space-y-3"
                     cdkDropList [id]="section.id" [cdkDropListData]="getTasksForSection(section.id)"
                     (cdkDropListDropped)="drop($event)">
                    @for (task of getTasksForSection(section.id); track task.id) {
                        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border hover:shadow-md transition group relative flex flex-col cursor-move"
                             [ngClass]="getSectionStyle(section.color).cardBorder"
                             [class.opacity-75]="section.id === 'Done'"
                             cdkDrag [cdkDragData]="task">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-xs font-semibold px-2 py-0.5 rounded" 
                                      [ngClass]="getPriorityClass(task.priority)">{{ task.priority }}</span>
                                
                                <div class="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition">
                                    <button *ngIf="hasChildUsers() || (task.subTasksCount && task.subTasksCount > 0)" (click)="openCommentsModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-purple-600 dark:text-purple-400" title="Split / Manage Sub-Tasks">
                                        <lucide-icon name="git-fork" class="h-4 w-4"></lucide-icon>
                                    </button>
                                    <button (click)="openCommentsModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500" title="Comments">
                                        <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
                                    </button>
                                    <button *ngIf="canEdit(task)" (click)="openEditModal(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Edit">
                                        <lucide-icon name="edit-3" class="h-4 w-4"></lucide-icon>
                                    </button>

                                    <!-- Previous Section Button -->
                                    <button *ngIf="canMovePrev(section.id)" (click)="moveTaskToPrevSection(task, section.id)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Move Back">
                                        <lucide-icon name="arrow-left" class="h-4 w-4"></lucide-icon>
                                    </button>
                                    <!-- Next Section Button -->
                                    <button *ngIf="canMoveNext(section.id)" (click)="moveTaskToNextSection(task, section.id)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400" title="Move Forward">
                                        <lucide-icon name="chevron-right" class="h-4 w-4"></lucide-icon>
                                    </button>

                                    <button *ngIf="canDelete(task)" (click)="deleteTask(task)" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400" title="Delete">
                                        <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                                    </button>
                                </div>
                            </div>
                            <h3 class="font-medium text-gray-800 dark:text-gray-200 mb-1 cursor-pointer" [class.line-through]="section.id === 'Done'" (click)="openCommentsModal(task)">{{ task.title }}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3" title="{{task.description}}">{{ task.description | slice:0:300 }}{{ task.description.length > 300 ? '...' : '' }}</p>
                            
                             <!-- Sub-Task Progress Bar & Sub-Tasks Breakdown Accordion -->
                             <div *ngIf="task.subTasksCount && task.subTasksCount > 0" class="mb-3 p-2 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/30 transition-all">
                                 <!-- Accordion Header Toggle -->
                                 <div (click)="toggleSubTasks(task.id, $event)" class="flex justify-between items-center text-[11px] font-medium text-purple-900 dark:text-purple-300 mb-1 cursor-pointer select-none group/accordion hover:text-purple-700 dark:hover:text-purple-200">
                                     <span class="flex items-center gap-1 font-semibold">
                                         <lucide-icon name="list-checks" class="h-3.5 w-3.5 text-purple-600 dark:text-purple-400"></lucide-icon>
                                         Sub-tasks Progress
                                         <lucide-icon [name]="isSubTasksExpanded(task.id) ? 'chevron-up' : 'chevron-down'" class="h-3.5 w-3.5 text-purple-500 transition-transform duration-200 ml-0.5"></lucide-icon>
                                     </span>
                                     <span class="text-purple-700 dark:text-purple-300 font-bold">{{ task.completedSubTasksCount }}/{{ task.subTasksCount }} Done ({{ task.progressPercentage }}%)</span>
                                 </div>
                                 <div class="w-full bg-purple-200 dark:bg-purple-900/40 h-1.5 rounded-full overflow-hidden">
                                     <div class="bg-purple-600 h-full transition-all duration-300 rounded-full" [style.width.%]="task.progressPercentage"></div>
                                 </div>

                                  <!-- Collapsible Sub-Task Items Breakdown -->
                                  @if (isSubTasksExpanded(task.id) && task.subTasks && task.subTasks.length > 0) {
                                      <div class="mt-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/60 space-y-1.5">
                                          @for (st of task.subTasks; track st.id || $index) {
                                              <div class="flex items-center justify-between text-xs bg-purple-100/70 dark:bg-gray-800 p-2 rounded-lg border border-purple-200/80 dark:border-gray-700 text-gray-900 dark:text-white">
                                                  <div class="flex items-center gap-1.5 min-w-0 pr-1 text-gray-900 dark:text-white">
                                                      <lucide-icon name="corner-down-right" class="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0"></lucide-icon>
                                                      <span class="truncate font-semibold text-gray-900 dark:text-white" [class.line-through]="st.status === 'Done' || st.status === 'Completed'">{{ st.title }}</span>
                                                  </div>
                                                  <div class="flex items-center gap-1.5 shrink-0 text-white">
                                                      @if (st.assigneeName) {
                                                          <span class="text-[10px] bg-purple-600 text-white dark:bg-purple-700 dark:text-white px-1.5 py-0.5 rounded font-bold shadow-xs">
                                                              {{ st.assigneeName }}
                                                          </span>
                                                      }
                                                      <span [class]="getStatusBadgeClass(st.status)" class="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold text-white shadow-xs">
                                                          {{ st.status }}
                                                      </span>
                                                  </div>
                                              </div>
                                          }
                                      </div>
                                  }
                             </div>

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

                    <button (click)="openCreateModal(section.id)" class="w-full py-2 px-3 border border-dashed rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition" [ngClass]="[getSectionStyle(section.color).dashedBorder, getSectionStyle(section.color).btnText]">
                        <lucide-icon name="plus" class="h-3.5 w-3.5"></lucide-icon>
                        Add Task to {{ section.name }}
                    </button>
                </div>
             </div>
          }

          <!-- Add New Section Card (Placed after the last section) -->
          <div *ngIf="isAdmin()" (click)="openAddSectionModal()" class="flex-none flex flex-col justify-center items-center bg-white/50 dark:bg-gray-800/30 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl min-w-[280px] max-w-[280px] h-full cursor-pointer transition group hover:shadow-md p-6">
              <div class="flex flex-col items-center text-center my-auto">
                  <div class="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 transition transform group-hover:scale-110">
                      <lucide-icon name="plus" class="h-6 w-6"></lucide-icon>
                  </div>
                  <h3 class="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">Add New Section</h3>
                  <p class="text-xs text-gray-400 mt-1">Create a custom section column</p>
              </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class TaskDashboardComponent implements OnInit {
    private taskService = inject(TaskService);
    public authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private zone = inject(NgZone);

    tasks = signal<Task[]>([]);
    showArchived = signal(false);
    users = signal<any[]>([]); // To store available users for filter

    // Filters
    filterPriority = signal<string>('All');
    filterAssignee = signal<string>('All');
    filterDueDate = signal<string>('All');

    // Dynamic Board Sections
    sections = signal<BoardSection[]>([]);
    sectionTasksMap = signal<{ [sectionId: string]: Task[] }>({});

    // Sub-Tasks Accordion state
    expandedSubTaskCardIds = signal<Set<string>>(new Set());

    constructor() {
        // Effect to reorganize tasks when filters change
        effect(() => {
            const currentTasks = this.tasks();
            this.filterPriority();
            this.filterAssignee();
            this.filterDueDate();

            this.organizeTasks();
        }, { allowSignalWrites: true });
    }

    ngOnInit() {
        this.loadSections();
        this.loadTasks();
        this.loadUsers();

        // Listen for Global Refresh
        this.taskService.refreshTasks$.subscribe(() => {
            this.loadTasks();
        });

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

    loadSections() {
        this.taskService.fetchBoardSections().subscribe({
            next: (fetchedSections) => {
                let sectionsList = (fetchedSections && fetchedSections.length > 0) ? [...fetchedSections] : this.taskService.getBoardSections();
                const existingIds = new Set(sectionsList.map(s => s.id));
                let hasNewStatus = false;

                for (const task of this.tasks()) {
                    if (task.status && task.status !== 'Completed' && task.status !== 'Done' && !existingIds.has(task.status)) {
                        sectionsList.push({
                            id: task.status,
                            name: task.status,
                            color: 'indigo',
                            isCustom: true
                        });
                        existingIds.add(task.status);
                        hasNewStatus = true;
                    }
                }

                this.sections.set(sectionsList);
                if (hasNewStatus) {
                    this.taskService.saveBoardSections(sectionsList);
                } else {
                    localStorage.setItem('task_board_sections', JSON.stringify(sectionsList));
                }
                this.organizeTasks();
            },
            error: () => {
                this.sections.set(this.taskService.getBoardSections());
                this.organizeTasks();
            }
        });
    }

    loadUsers() {
        this.authService.getUsers().subscribe(u => this.users.set(u));
    }

    loadTasks() {
        this.taskService.getTasks(this.showArchived()).subscribe(tasks => {
            this.zone.run(() => {
                this.tasks.set(tasks);
                this.loadSections();
                this.organizeTasks();
                this.cdr.markForCheck();
                this.cdr.detectChanges();

                const openId = this.route.snapshot.queryParams['openTaskId'];
                if (openId) {
                    this.checkAndOpenTask(openId);
                }
            });
        });
    }

    organizeTasks() {
        const allTasks = this.tasks();
        const filtered = this.filterTasks(allTasks);
        const map: { [secId: string]: Task[] } = {};

        for (const section of this.sections()) {
            map[section.id] = this.sortTasks(filtered.filter(t => {
                if (t.status === section.id) return true;
                if ((t.status === 'Completed' || t.status === 'Done') && (section.isCompletedSection || section.id === 'Done' || section.id === 'Completed')) return true;
                return false;
            }));
        }

        this.sectionTasksMap.set(map);
        this.cdr.markForCheck();
    }

    getTasksForSection(sectionId: string): Task[] {
        return this.sectionTasksMap()[sectionId] || [];
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
                this.taskService.openModal('comments', task);
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

    getSectionStyle(color: string) {
        switch (color) {
            case 'blue':
                return {
                    bg: 'bg-blue-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-blue-50 dark:bg-gray-800',
                    border: 'border-blue-100 dark:border-gray-700',
                    cardBorder: 'border-blue-100 dark:border-gray-700',
                    text: 'text-blue-700 dark:text-blue-400',
                    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                    btnHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/50',
                    btnText: 'text-blue-600 dark:text-blue-400',
                    dashedBorder: 'border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                };
            case 'purple':
                return {
                    bg: 'bg-purple-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-purple-50 dark:bg-gray-800',
                    border: 'border-purple-100 dark:border-gray-700',
                    cardBorder: 'border-purple-100 dark:border-gray-700',
                    text: 'text-purple-700 dark:text-purple-400',
                    badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                    btnHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/50',
                    btnText: 'text-purple-600 dark:text-purple-400',
                    dashedBorder: 'border-purple-300 dark:border-purple-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                };
            case 'green':
                return {
                    bg: 'bg-green-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-green-50 dark:bg-gray-800',
                    border: 'border-green-100 dark:border-gray-700',
                    cardBorder: 'border-green-100 dark:border-gray-700',
                    text: 'text-green-700 dark:text-green-400',
                    badge: 'bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                    btnHover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
                    btnText: 'text-green-600 dark:text-green-400',
                    dashedBorder: 'border-green-300 dark:border-green-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                };
            case 'indigo':
                return {
                    bg: 'bg-indigo-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-indigo-50 dark:bg-gray-800',
                    border: 'border-indigo-100 dark:border-gray-700',
                    cardBorder: 'border-indigo-100 dark:border-gray-700',
                    text: 'text-indigo-700 dark:text-indigo-400',
                    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                    btnHover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
                    btnText: 'text-indigo-600 dark:text-indigo-400',
                    dashedBorder: 'border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                };
            case 'amber':
                return {
                    bg: 'bg-amber-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-amber-50 dark:bg-gray-800',
                    border: 'border-amber-100 dark:border-gray-700',
                    cardBorder: 'border-amber-100 dark:border-gray-700',
                    text: 'text-amber-700 dark:text-amber-400',
                    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
                    btnHover: 'hover:bg-amber-100 dark:hover:bg-amber-900/50',
                    btnText: 'text-amber-600 dark:text-amber-400',
                    dashedBorder: 'border-amber-300 dark:border-amber-700 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                };
            case 'teal':
                return {
                    bg: 'bg-teal-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-teal-50 dark:bg-gray-800',
                    border: 'border-teal-100 dark:border-gray-700',
                    cardBorder: 'border-teal-100 dark:border-gray-700',
                    text: 'text-teal-700 dark:text-teal-400',
                    badge: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
                    btnHover: 'hover:bg-teal-100 dark:hover:bg-teal-900/50',
                    btnText: 'text-teal-600 dark:text-teal-400',
                    dashedBorder: 'border-teal-300 dark:border-teal-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                };
            case 'rose':
                return {
                    bg: 'bg-rose-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-rose-50 dark:bg-gray-800',
                    border: 'border-rose-100 dark:border-gray-700',
                    cardBorder: 'border-rose-100 dark:border-gray-700',
                    text: 'text-rose-700 dark:text-rose-400',
                    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
                    btnHover: 'hover:bg-rose-100 dark:hover:bg-rose-900/50',
                    btnText: 'text-rose-600 dark:text-rose-400',
                    dashedBorder: 'border-rose-300 dark:border-rose-700 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                };
            case 'cyan':
                return {
                    bg: 'bg-cyan-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-cyan-50 dark:bg-gray-800',
                    border: 'border-cyan-100 dark:border-gray-700',
                    cardBorder: 'border-cyan-100 dark:border-gray-700',
                    text: 'text-cyan-700 dark:text-cyan-400',
                    badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
                    btnHover: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/50',
                    btnText: 'text-cyan-600 dark:text-cyan-400',
                    dashedBorder: 'border-cyan-300 dark:border-cyan-700 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
                };
            case 'emerald':
                return {
                    bg: 'bg-emerald-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-emerald-50 dark:bg-gray-800',
                    border: 'border-emerald-100 dark:border-gray-700',
                    cardBorder: 'border-emerald-100 dark:border-gray-700',
                    text: 'text-emerald-700 dark:text-emerald-400',
                    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                    btnHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
                    btnText: 'text-emerald-600 dark:text-emerald-400',
                    dashedBorder: 'border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                };
            case 'violet':
                return {
                    bg: 'bg-violet-50/50 dark:bg-gray-800/50',
                    headerBg: 'bg-violet-50 dark:bg-gray-800',
                    border: 'border-violet-100 dark:border-gray-700',
                    cardBorder: 'border-violet-100 dark:border-gray-700',
                    text: 'text-violet-700 dark:text-violet-400',
                    badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
                    btnHover: 'hover:bg-violet-100 dark:hover:bg-violet-900/50',
                    btnText: 'text-violet-600 dark:text-violet-400',
                    dashedBorder: 'border-violet-300 dark:border-violet-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                };
            default: // gray
                return {
                    bg: 'bg-gray-100 dark:bg-gray-800/50',
                    headerBg: 'bg-gray-50 dark:bg-gray-800',
                    border: 'border-gray-200 dark:border-gray-700',
                    cardBorder: 'border-gray-200 dark:border-gray-700',
                    text: 'text-gray-700 dark:text-gray-200',
                    badge: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                    btnHover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
                    btnText: 'text-gray-600 dark:text-gray-300',
                    dashedBorder: 'border-gray-300 dark:border-gray-700 hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/20'
                };
        }
    }

    isOverdue(date: Date) {
        return new Date(date) < new Date() && new Date(date).getDate() !== new Date().getDate();
    }

    moveTask(task: Task, newSectionId: string) {
        const sec = this.sections().find(s => s.id === newSectionId);
        const statusToSave = (sec?.isCompletedSection || newSectionId === 'Done') ? 'Completed' : newSectionId;
        this.taskService.updateStatus(task.id, statusToSave).subscribe(() => {
            this.loadTasks();
        });
    }

    canMovePrev(sectionId: string): boolean {
        const idx = this.sections().findIndex(s => s.id === sectionId);
        return idx > 0;
    }

    canMoveNext(sectionId: string): boolean {
        const idx = this.sections().findIndex(s => s.id === sectionId);
        return idx >= 0 && idx < this.sections().length - 1;
    }

    moveTaskToPrevSection(task: Task, currentSectionId: string) {
        const all = this.sections();
        const idx = all.findIndex(s => s.id === currentSectionId);
        if (idx > 0) {
            this.moveTask(task, all[idx - 1].id);
        }
    }

    moveTaskToNextSection(task: Task, currentSectionId: string) {
        const all = this.sections();
        const idx = all.findIndex(s => s.id === currentSectionId);
        if (idx >= 0 && idx < all.length - 1) {
            this.moveTask(task, all[idx + 1].id);
        }
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

    openAddSectionModal() {
        const colors = [
            { id: 'indigo', name: 'Indigo', bg: '#eef2ff', text: '#4338ca' },
            { id: 'blue', name: 'Blue', bg: '#eff6ff', text: '#1d4ed8' },
            { id: 'purple', name: 'Purple', bg: '#faf5ff', text: '#7e22ce' },
            { id: 'green', name: 'Green', bg: '#f0fdf4', text: '#15803d' },
            { id: 'amber', name: 'Amber', bg: '#fffbeb', text: '#b45309' },
            { id: 'teal', name: 'Teal', bg: '#f0fdfa', text: '#0f766e' },
            { id: 'rose', name: 'Rose', bg: '#fff1f2', text: '#be123c' },
            { id: 'cyan', name: 'Cyan', bg: '#ecfeff', text: '#0e7490' },
            { id: 'emerald', name: 'Emerald', bg: '#ecfdf5', text: '#047857' },
            { id: 'violet', name: 'Violet', bg: '#f5f3ff', text: '#6d28d9' },
            { id: 'gray', name: 'Gray', bg: '#f3f4f6', text: '#374151' }
        ];

        const optionsHtml = colors.map((c, idx) => `
            <label style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; margin: 3px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; background: ${c.bg}; color: ${c.text}; font-size: 13px; font-weight: 500;">
                <input type="radio" name="swal-new-color" value="${c.id}" ${idx === 0 ? 'checked' : ''} style="accent-color: #2563eb;">
                <span>${c.name}</span>
            </label>
        `).join('');

        Swal.fire({
            title: 'Add New Section',
            html: `
                <div style="text-align: left; display: flex; flex-direction: column; gap: 12px;">
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px;">Section Name</label>
                        <input id="swal-sec-name" class="swal2-input" placeholder="e.g. Testing, QA, Approved..." style="margin: 0; width: 100%; box-sizing: border-box;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">Background Color Theme</label>
                        <div style="max-height: 140px; overflow-y: auto; display: flex; flex-wrap: wrap;">${optionsHtml}</div>
                    </div>
                    <div style="margin-top: 4px; padding-top: 10px; border-t: 1px solid #f3f4f6;">
                        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer;">
                            <input type="checkbox" id="swal-is-completed" style="width: 16px; height: 16px; accent-color: #16a34a; cursor: pointer;">
                            <span>Mark tasks as Completed when moved to this section</span>
                        </label>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add Section',
            confirmButtonColor: '#2563eb',
            preConfirm: () => {
                const name = (document.getElementById('swal-sec-name') as HTMLInputElement)?.value?.trim();
                const color = (document.querySelector('input[name="swal-new-color"]:checked') as HTMLInputElement)?.value || 'indigo';
                const isCompletedSection = (document.getElementById('swal-is-completed') as HTMLInputElement)?.checked || false;
                
                if (!name) {
                    Swal.showValidationMessage('Section name cannot be empty!');
                    return false;
                }
                const exists = this.sections().some(s => s.name.toLowerCase() === name.toLowerCase());
                if (exists) {
                    Swal.showValidationMessage('A section with this name already exists!');
                    return false;
                }
                return { name, color, isCompletedSection };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const { name, color, isCompletedSection } = result.value;
                const newSec: BoardSection = {
                    id: name,
                    name: name,
                    color: color,
                    isCustom: true,
                    isCompletedSection: isCompletedSection
                };
                const updated = [...this.sections(), newSec];
                this.sections.set(updated);
                this.taskService.saveBoardSections(updated);
                this.organizeTasks();
                Swal.fire({
                    icon: 'success',
                    title: 'Section Created',
                    text: `"${name}" section column has been created with ${color} theme.`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    openChangeColorModal(section: BoardSection) {
        const colors = [
            { id: 'gray', name: 'Default Gray', bg: '#f3f4f6', text: '#374151' },
            { id: 'blue', name: 'Blue', bg: '#eff6ff', text: '#1d4ed8' },
            { id: 'purple', name: 'Purple', bg: '#faf5ff', text: '#7e22ce' },
            { id: 'green', name: 'Green', bg: '#f0fdf4', text: '#15803d' },
            { id: 'indigo', name: 'Indigo', bg: '#eef2ff', text: '#4338ca' },
            { id: 'amber', name: 'Amber', bg: '#fffbeb', text: '#b45309' },
            { id: 'teal', name: 'Teal', bg: '#f0fdfa', text: '#0f766e' },
            { id: 'rose', name: 'Rose', bg: '#fff1f2', text: '#be123c' },
            { id: 'cyan', name: 'Cyan', bg: '#ecfeff', text: '#0e7490' },
            { id: 'emerald', name: 'Emerald', bg: '#ecfdf5', text: '#047857' },
            { id: 'violet', name: 'Violet', bg: '#f5f3ff', text: '#6d28d9' }
        ];

        const optionsHtml = colors.map(c => `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin: 4px 0; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; background: ${c.bg}; color: ${c.text}; font-weight: 500; font-size: 13px;">
                <input type="radio" name="swal-color" value="${c.id}" ${c.id === section.color ? 'checked' : ''} style="accent-color: #2563eb;">
                <span>${c.name}</span>
            </label>
        `).join('');

        Swal.fire({
            title: `Choose Color for "${section.name}"`,
            html: `<div style="max-height: 250px; overflow-y: auto; text-align: left; padding: 4px;">${optionsHtml}</div>`,
            showCancelButton: true,
            confirmButtonText: 'Save Color',
            confirmButtonColor: '#2563eb',
            preConfirm: () => {
                const selected = (document.querySelector('input[name="swal-color"]:checked') as HTMLInputElement)?.value;
                return selected || section.color;
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const newColor = result.value;
                const updated = this.sections().map(s => s.id === section.id ? { ...s, color: newColor } : s);
                this.sections.set(updated);
                this.taskService.saveBoardSections(updated);
                this.organizeTasks();
            }
        });
    }

    deleteSection(section: BoardSection) {
        const taskCount = this.getTasksForSection(section.id).length;
        if (taskCount > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Cannot Delete Section',
                text: `Please move or delete the ${taskCount} task(s) in "${section.name}" before deleting this section.`
            });
            return;
        }

        Swal.fire({
            title: `Delete "${section.name}" Section?`,
            text: 'This section column will be removed from your board.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d33'
        }).then((res) => {
            if (res.isConfirmed) {
                const updated = this.sections().filter(s => s.id !== section.id);
                this.sections.set(updated);
                this.taskService.saveBoardSections(updated);
                this.organizeTasks();
                Swal.fire({
                    icon: 'success',
                    title: 'Section Removed',
                    text: `"${section.name}" section column has been removed.`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    canEdit(task: Task) {
        const user = this.authService.currentUser();
        if (!user) return false;
        const myId = String(user.id);
        const creatorId = String(task.createdByUserId);
        const isAssignee = task.assignees?.some(a => String(a.id) === myId) || String(task.assignedToUserId) === myId;
        return user.role === 'admin' || myId === creatorId || isAssignee;
    }

    canDelete(task: Task) {
        const user = this.authService.currentUser();
        if (!user) return false;
        return user.role === 'admin' || String(user.id) === String(task.createdByUserId);
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'Done':
            case 'Completed':
                return 'bg-emerald-600 text-white';
            case 'In Progress':
                return 'bg-blue-600 text-white';
            case 'Review':
                return 'bg-purple-600 text-white';
            default:
                return 'bg-amber-600 text-white';
        }
    }

    toggleSubTasks(taskId: string, event?: Event) {
        if (event) event.stopPropagation();
        const set = new Set(this.expandedSubTaskCardIds());
        if (set.has(taskId)) {
            set.delete(taskId);
        } else {
            set.add(taskId);
        }
        this.expandedSubTaskCardIds.set(set);
    }

    isSubTasksExpanded(taskId: string): boolean {
        return this.expandedSubTaskCardIds().has(taskId);
    }

    hasChildUsers(): boolean {
        const me = this.authService.currentUser();
        if (!me) return false;
        return this.users().some(u => u.parentUserId && String(u.parentUserId) === String(me.id));
    }

    openCreateModal(status?: string) {
        this.taskService.openModal('create', undefined, status);
    }

    openEditModal(task: Task) {
        this.taskService.openModal('edit', task);
    }

    openCommentsModal(task: Task) {
        this.taskService.openModal('comments', task);
    }

    drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            const map = { ...this.sectionTasksMap() };
            map[event.container.id] = [...event.container.data];
            this.sectionTasksMap.set(map);
        } else {
            const prevData = [...event.previousContainer.data];
            const currData = [...event.container.data];

            transferArrayItem(
                prevData,
                currData,
                event.previousIndex,
                event.currentIndex,
            );

            const map = { ...this.sectionTasksMap() };
            map[event.previousContainer.id] = prevData;
            map[event.container.id] = currData;
            this.sectionTasksMap.set(map);

            const task = event.item.data as Task;
            const newSectionId = event.container.id;
            const sec = this.sections().find(s => s.id === newSectionId);
            const statusToSave = (sec?.isCompletedSection || newSectionId === 'Done') ? 'Completed' : newSectionId;

            this.taskService.updateStatus(task.id, statusToSave).subscribe({
                next: () => {
                    this.loadTasks();
                },
                error: (err: any) => {
                    console.error('Update failed', err);
                    this.loadTasks();
                }
            });
        }
    }
}
