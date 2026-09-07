import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconsModule } from '../../core/modules/icons.module';
import { UserHistoryService, UserActivityLog, UserHistoryStats } from '../../core/services/user-history.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-history',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div class="max-w-7xl mx-auto space-y-6">

        <!-- Top Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <div class="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
                <lucide-icon name="history" class="h-6 w-6"></lucide-icon>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">User History & Audit Trail</h1>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Complete chronological activity tracking across all application modules</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap">
            <button (click)="exportCsv()" [disabled]="logs().length === 0"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm font-medium transition shadow-sm disabled:opacity-50">
              <lucide-icon name="download" class="h-4 w-4 text-emerald-600 dark:text-emerald-400"></lucide-icon>
              Export CSV
            </button>

            <button (click)="loadHistory()"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition shadow-sm shadow-blue-500/20">
              <lucide-icon name="rotate-ccw" class="h-4 w-4" [class.animate-spin]="isLoading()"></lucide-icon>
              Refresh
            </button>

            <a routerLink="/files"
               class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm font-medium transition shadow-sm">
              <lucide-icon name="arrow-left" class="h-4 w-4"></lucide-icon>
              Back
            </a>
          </div>
        </div>

        <!-- KPI Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Activities -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Activities</span>
              <p class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ stats().totalActivities }}</p>
              <p class="text-[11px] text-gray-500">Across entire system</p>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <lucide-icon name="history" class="h-6 w-6"></lucide-icon>
            </div>
          </div>

          <!-- Today's Activity -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activities Today</span>
              <div class="flex items-baseline gap-2">
                <p class="text-2xl font-extrabold text-gray-900 dark:text-white">{{ stats().todayCount }}</p>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <p class="text-[11px] text-gray-500">Recorded since midnight</p>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <lucide-icon name="clock" class="h-6 w-6"></lucide-icon>
            </div>
          </div>

          <!-- Most Active Module -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Module</span>
              <p class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 truncate max-w-[140px]">{{ topModule().name }}</p>
              <p class="text-[11px] text-gray-500">{{ topModule().count }} logged operations</p>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <lucide-icon name="layers" class="h-6 w-6"></lucide-icon>
            </div>
          </div>

          <!-- Active Users -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Users</span>
              <p class="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{{ stats().activeUserCount }}</p>
              <p class="text-[11px] text-gray-500">Users contributing to logs</p>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <lucide-icon name="users" class="h-6 w-6"></lucide-icon>
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls Card -->
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          
          <!-- Module Pills Filter -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0 mr-1 flex items-center gap-1">
              <lucide-icon name="filter" class="h-3.5 w-3.5"></lucide-icon>
              Modules:
            </span>
            <button *ngFor="let mod of moduleList"
                    (click)="setModuleFilter(mod.id)"
                    [ngClass]="selectedModule() === mod.id ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
                    class="px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition flex items-center gap-1.5">
              <span>{{ mod.label }}</span>
              <span *ngIf="mod.id !== 'all' && stats().modules[mod.id]" 
                    [ngClass]="selectedModule() === mod.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'"
                    class="px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {{ stats().modules[mod.id] }}
              </span>
            </button>
          </div>

          <!-- Secondary Filters Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            
            <!-- Search Keyword -->
            <div class="relative">
              <input type="text" [(ngModel)]="searchKeyword" (ngModelChange)="onSearchChange()"
                     placeholder="Search user, action, details..."
                     class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white transition">
              <lucide-icon name="search" class="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></lucide-icon>
            </div>

            <!-- User Dropdown -->
            <div>
              <select [(ngModel)]="selectedUserId" (change)="onFilterChange()"
                      class="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white transition">
                <option value="all">All Users</option>
                <option *ngFor="let u of userList()" [value]="u.id">{{ u.name }} ({{ u.role }})</option>
              </select>
            </div>

            <!-- Date Range Preset -->
            <div>
              <select [(ngModel)]="selectedDatePreset" (change)="onDatePresetChange()"
                      class="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 dark:bg-gray-700 text-gray-900 dark:text-white transition">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            <!-- Results Summary & Reset -->
            <div class="flex items-center justify-between sm:justify-end gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>Showing <strong>{{ logs().length }}</strong> of <strong>{{ totalCount() }}</strong></span>
              <button *ngIf="hasActiveFilters()" (click)="resetFilters()" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Reset Filters
              </button>
            </div>

          </div>

        </div>

        <!-- Activity History Table & Feed -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/50">
            <h2 class="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <lucide-icon name="list-checks" class="h-4 w-4 text-indigo-500"></lucide-icon>
              Activity Logs
            </h2>
            <span class="text-xs text-gray-400">Page {{ currentPage() }} of {{ totalPages() || 1 }}</span>
          </div>

          <!-- Loading State -->
          <div *ngIf="isLoading()" class="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <lucide-icon name="loader-2" class="h-8 w-8 animate-spin text-blue-600"></lucide-icon>
            <p class="text-sm">Fetching user history logs...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading() && logs().length === 0" class="py-16 text-center space-y-3">
            <div class="h-16 w-16 bg-gray-100 dark:bg-gray-700/60 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <lucide-icon name="history" class="h-8 w-8"></lucide-icon>
            </div>
            <h3 class="text-base font-semibold text-gray-700 dark:text-gray-300">No activity logs found</h3>
            <p class="text-xs text-gray-500 max-w-sm mx-auto">No records match the selected filter criteria. Try adjusting your filters or search terms.</p>
            <button (click)="resetFilters()" class="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-100 transition">
              Reset All Filters
            </button>
          </div>

          <!-- Table View -->
          <div *ngIf="!isLoading() && logs().length > 0" class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-50/75 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 text-[11px] uppercase font-semibold tracking-wider">
                <tr>
                  <th class="px-6 py-3.5">User</th>
                  <th class="px-6 py-3.5">Module</th>
                  <th class="px-6 py-3.5">Action & Entity</th>
                  <th class="px-6 py-3.5">Details</th>
                  <th class="px-6 py-3.5 whitespace-nowrap">Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs">
                <tr *ngFor="let item of logs()" class="hover:bg-blue-50/20 dark:hover:bg-gray-700/30 transition">
                  
                  <!-- User Column -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                           [ngClass]="(item.userRole || '').toLowerCase() === 'admin' ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-blue-500 to-cyan-500'">
                        {{ getUserInitials(item.userName) }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                          <span class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ item.userName }}</span>
                        </div>
                        <span [ngClass]="(item.userRole || '').toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 text-gray-400'"
                              class="px-1.5 py-0.2 text-[9px] font-bold rounded-md uppercase tracking-wider">
                          {{ item.userRole }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <!-- Module Column -->
                  <td class="px-6 py-4">
                    <span [ngClass]="getModuleBadgeClass(item.module)"
                          class="px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border">
                      <lucide-icon [name]="getModuleIcon(item.module)" class="h-3 w-3"></lucide-icon>
                      {{ item.module }}
                    </span>
                  </td>

                  <!-- Action & Entity Column -->
                  <td class="px-6 py-4">
                    <div class="space-y-0.5">
                      <p class="font-bold text-gray-800 dark:text-gray-200">{{ item.action }}</p>
                      <p *ngIf="item.entityName" class="text-gray-500 dark:text-gray-400 text-[11px] truncate max-w-[200px]" [title]="item.entityName">
                        {{ item.entityName }}
                      </p>
                    </div>
                  </td>

                  <!-- Details Column -->
                  <td class="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs sm:max-w-md">
                    <p class="truncate-2-lines leading-relaxed" [title]="item.details || ''">
                      {{ item.details || '—' }}
                    </p>
                  </td>

                  <!-- Timestamp Column -->
                  <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    <p class="font-medium text-gray-800 dark:text-gray-200">{{ formatRelativeTime(item.createdAt) }}</p>
                    <p class="text-[11px] text-gray-400">{{ item.createdAt }}</p>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div *ngIf="totalPages() > 1" class="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="text-gray-500 dark:text-gray-400">
              Showing page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong>
            </div>

            <div class="flex items-center gap-1">
              <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
                      class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                Previous
              </button>
              
              <button *ngFor="let p of visiblePages()"
                      (click)="goToPage(p)"
                      [ngClass]="currentPage() === p ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50'"
                      class="h-8 w-8 rounded-lg border flex items-center justify-center transition">
                {{ p }}
              </button>

              <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages()"
                      class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
                Next
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class UserHistoryComponent implements OnInit {
  private historyService = inject(UserHistoryService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  logs = signal<UserActivityLog[]>([]);
  stats = signal<UserHistoryStats>({
    totalActivities: 0,
    todayCount: 0,
    activeUserCount: 0,
    modules: {}
  });

  isLoading = signal<boolean>(false);
  totalCount = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = 30;

  selectedModule = signal<string>('all');
  selectedUserId = 'all';
  selectedDatePreset = 'all';
  searchKeyword = '';

  userList = signal<User[]>([]);

  moduleList = [
    { id: 'all', label: 'All Modules' },
    { id: 'Files', label: 'Files & Folders' },
    { id: 'Tasks', label: 'Tasks' },
    { id: 'Followups', label: 'Followups' },
    { id: 'Masters', label: 'Masters' },
    { id: 'Users', label: 'Users & Roles' },
    { id: 'Auth', label: 'Authentication' }
  ];

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize));

  topModule = computed(() => {
    const mods = this.stats().modules;
    let topName = 'Files';
    let maxCnt = 0;
    for (const k in mods) {
      if (mods[k] > maxCnt) {
        maxCnt = mods[k];
        topName = k;
      }
    }
    return { name: topName, count: maxCnt };
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const curr = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, curr - 2);
    const end = Math.min(total, curr + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadHistory();
  }

  loadUsers() {
    this.authService.getUsers().subscribe(users => {
      this.userList.set(users);
    });
  }

  loadHistory() {
    this.isLoading.set(true);

    let startDate: string | null = null;
    let endDate: string | null = null;

    const now = new Date();
    if (this.selectedDatePreset === 'today') {
      startDate = now.toISOString().slice(0, 10);
      endDate = startDate;
    } else if (this.selectedDatePreset === '7days') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      startDate = past7.toISOString().slice(0, 10);
      endDate = now.toISOString().slice(0, 10);
    } else if (this.selectedDatePreset === '30days') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      startDate = past30.toISOString().slice(0, 10);
      endDate = now.toISOString().slice(0, 10);
    }

    this.historyService.getHistory({
      module: this.selectedModule(),
      userId: this.selectedUserId,
      search: this.searchKeyword,
      startDate,
      endDate,
      page: this.currentPage(),
      limit: this.pageSize
    }).subscribe({
      next: (res) => {
        this.logs.set(res.data || []);
        this.totalCount.set(res.total || 0);
        if (res.stats) {
          this.stats.set(res.stats);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.show('Failed to load user history logs', 'error');
        this.isLoading.set(false);
      }
    });
  }

  setModuleFilter(modId: string) {
    this.selectedModule.set(modId);
    this.currentPage.set(1);
    this.loadHistory();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadHistory();
  }

  onDatePresetChange() {
    this.currentPage.set(1);
    this.loadHistory();
  }

  private searchDebounce: any;
  onSearchChange() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(1);
      this.loadHistory();
    }, 300);
  }

  hasActiveFilters(): boolean {
    return this.selectedModule() !== 'all' ||
           this.selectedUserId !== 'all' ||
           this.selectedDatePreset !== 'all' ||
           this.searchKeyword.trim() !== '';
  }

  resetFilters() {
    this.selectedModule.set('all');
    this.selectedUserId = 'all';
    this.selectedDatePreset = 'all';
    this.searchKeyword = '';
    this.currentPage.set(1);
    this.loadHistory();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadHistory();
    }
  }

  exportCsv() {
    this.historyService.exportToCsv(this.logs());
    this.toast.show('Activity log exported to CSV', 'success');
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getModuleBadgeClass(module: string): string {
    switch (module) {
      case 'Files':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Tasks':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
      case 'Followups':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'Masters':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'Users':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'Auth':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  }

  getModuleIcon(module: string): string {
    switch (module) {
      case 'Files': return 'folder';
      case 'Tasks': return 'check-square';
      case 'Followups': return 'rotate-ccw';
      case 'Masters': return 'layout-grid';
      case 'Users': return 'user';
      case 'Auth': return 'key';
      default: return 'layers';
    }
  }

  formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(' ', 'T'));
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;
    return dateStr.slice(0, 10);
  }
}
