import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { IconsModule } from '../../core/modules/icons.module';
import { RouterLink } from '@angular/router';
import { User } from '../../core/models/user.model';
import { PermissionService } from '../../core/services/permission.service';
import { ModulePermission } from '../../core/models/permission.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div class="max-w-6xl mx-auto space-y-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
            <p class="text-gray-500 dark:text-gray-400">Manage users, hierarchy reports, and task progress</p>
          </div>
          <div class="flex items-center gap-3">
             <a routerLink="/user-history" class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium">
                <lucide-icon name="history" class="h-4 w-4"></lucide-icon>
                User History
             </a>
             <button (click)="openAddModal()" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium">
                <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
                Add User
             </button>
             <a routerLink="/files" class="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700">
                <lucide-icon name="arrow-left" class="h-4 w-4"></lucide-icon>
                Back to Files
             </a>
          </div>
        </div>

        <!-- Registered Users List -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Registered Users</h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                <tr>
                  <th class="px-6 py-3">Name</th>
                  <th class="px-6 py-3">Email</th>
                  <th class="px-6 py-3">Role</th>
                  <th class="px-6 py-3">Parent User</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngFor="let user of users()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td class="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{{ user.name }}</td>
                  <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ user.email }}</td>
                  <td class="px-6 py-4">
                    <span [class]="user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'"
                          class="px-2 py-1 rounded-full text-xs font-medium">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                     <span *ngIf="user.parentName" class="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                        <lucide-icon name="user" class="h-3 w-3 text-blue-500"></lucide-icon>
                        {{ user.parentName }}
                     </span>
                     <span *ngIf="!user.parentName" class="text-xs text-gray-400 italic">None</span>
                  </td>
                  <td class="px-6 py-4 text-right flex justify-end gap-2">
                     <button (click)="openPermissionsModal(user)" class="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition" title="Module Rights & Permissions">
                        <lucide-icon name="shield" class="h-4 w-4"></lucide-icon>
                     </button>
                     <button (click)="editUser(user)" class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Edit">
                        <lucide-icon name="edit-2" class="h-4 w-4"></lucide-icon>
                     </button>
                     <button (click)="deleteUser(user)" class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete">
                        <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                     </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- User Hierarchy & Task Completion Stats -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <lucide-icon name="list-checks" class="h-5 w-5 text-purple-600 dark:text-purple-400"></lucide-icon>
                User Hierarchy Task Completion Stats
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time breakdown of assigned task progress per user & sub-user</p>
            </div>
            <button (click)="loadUserStats()" class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 transition">
              <lucide-icon name="rotate-ccw" class="h-3.5 w-3.5"></lucide-icon>
              Refresh Stats
            </button>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                <tr>
                  <th class="px-6 py-3">User Name</th>
                  <th class="px-6 py-3">Parent User / Manager</th>
                  <th class="px-6 py-3 text-center">Total Tasks</th>
                  <th class="px-6 py-3 text-center">Task Status Breakdown</th>
                  <th class="px-6 py-3">Completion Rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngFor="let stat of userStats()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td class="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 flex items-center gap-2">
                     <span *ngIf="stat.parentUserId" class="text-gray-400 pl-3">└─</span>
                     <span>{{ stat.name }}</span>
                     <span [class]="stat.role === 'Admin' || stat.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 text-[10px]' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 text-[10px]'" class="px-2 py-0.5 rounded-full font-semibold ml-1">
                        {{ stat.role }}
                     </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                     <span *ngIf="stat.parentName" class="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-100 dark:border-blue-800">
                        <lucide-icon name="user" class="h-3 w-3 text-blue-500"></lucide-icon>
                        {{ stat.parentName }}
                     </span>
                     <span *ngIf="!stat.parentName" class="text-xs text-gray-400 italic">Top Level</span>
                  </td>
                  <td class="px-6 py-4 text-center font-bold text-gray-800 dark:text-gray-200">
                      {{ stat.totalTasks }}
                  </td>
                  <td class="px-6 py-4 text-center">
                     <div class="inline-flex items-center gap-1.5">
                        <span class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-0.5 rounded-full text-xs font-semibold" title="Completed">
                            {{ stat.completedTasks }} Done
                        </span>
                        <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-semibold" title="In Progress">
                            {{ stat.inProgressTasks }} Progress
                        </span>
                        <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-full text-xs font-semibold" title="Pending">
                            {{ stat.pendingTasks }} Pending
                        </span>
                     </div>
                  </td>
                  <td class="px-6 py-4 min-w-[180px]">
                     <div class="flex items-center gap-2">
                        <div class="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                           <div class="bg-blue-600 h-full rounded-full transition-all duration-300" [style.width.%]="stat.completionRate"></div>
                        </div>
                        <span class="text-xs font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{{ stat.completionRate }}%</span>
                     </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Task-Wise Hierarchy & Sub-Tasks Breakdown -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <lucide-icon name="git-fork" class="h-5 w-5 text-indigo-600 dark:text-indigo-400"></lucide-icon>
                Task-Wise Hierarchy & Sub-Tasks Breakdown
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Parent task progress and assigned child user sub-task status</p>
            </div>
            <button (click)="loadHierarchyTasks()" class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800 transition">
              <lucide-icon name="rotate-ccw" class="h-3.5 w-3.5"></lucide-icon>
              Refresh Tasks
            </button>
          </div>
          
          <div class="p-6 space-y-4">
            <div *ngFor="let pTask of hierarchyTasks()" class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/30 dark:bg-gray-800/30 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700/50 pb-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-gray-900 dark:text-white text-base">{{ pTask.parentTitle }}</h3>
                    <span [class]="getStatusBadgeClass(pTask.parentStatus)" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {{ pTask.parentStatus }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Created by <strong class="text-gray-700 dark:text-gray-300">{{ pTask.parentCreatorName }}</strong></span>
                  </div>
                </div>
                
                <div class="flex items-center gap-4">
                  <div *ngIf="pTask.totalSubTasks > 0" class="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <span>Sub-tasks: {{ pTask.completedSubTasks }}/{{ pTask.totalSubTasks }} Done ({{ pTask.subTaskProgressRate }}%)</span>
                    <div class="w-24 bg-purple-200 dark:bg-purple-900/40 h-2 rounded-full overflow-hidden">
                      <div class="bg-purple-600 h-full rounded-full transition-all duration-300" [style.width.%]="pTask.subTaskProgressRate"></div>
                    </div>
                  </div>
                  <span *ngIf="pTask.totalSubTasks === 0" class="text-xs text-gray-400 italic">No sub-tasks</span>
                </div>
              </div>

              <!-- Nested Child Sub-tasks list -->
              <div *ngIf="pTask.subTasks && pTask.subTasks.length > 0" class="pl-4 space-y-2 border-l-2 border-purple-300 dark:border-purple-800 ml-2">
                <div *ngFor="let st of pTask.subTasks" class="flex items-center justify-between bg-white dark:bg-gray-700/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 text-xs">
                  <div class="flex items-center gap-2">
                    <lucide-icon name="corner-down-right" class="h-3.5 w-3.5 text-purple-500"></lucide-icon>
                    <span class="font-medium text-gray-800 dark:text-gray-200">{{ st.subTaskTitle }}</span>
                    <span [class]="getPriorityClass(st.subTaskPriority)" class="px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {{ st.subTaskPriority }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span *ngIf="st.assignees && st.assignees.length > 0" class="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[11px] font-medium border border-purple-100 dark:border-purple-800">
                      <lucide-icon name="user" class="h-3 w-3 text-purple-500"></lucide-icon>
                      Child: {{ st.assignees.join(', ') }}
                    </span>
                    <span *ngIf="!st.assignees || st.assignees.length === 0" class="text-gray-400 italic text-[11px]">Unassigned</span>
                    <span [class]="getStatusBadgeClass(st.subTaskStatus)" class="px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {{ st.subTaskStatus }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- User Modal -->
      <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeModal()"></div>
        
        <!-- Modal Content -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                    {{ editingMode() ? 'Edit User' : 'Add New User' }}
                </h3>
                <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                    <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
                </button>
            </div>
            
            <div class="p-6">
                <form (ngSubmit)="saveUser()" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input type="text" [(ngModel)]="newUser.name" name="name" required placeholder="Enter full name"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email / Username</label>
                        <input type="text" [(ngModel)]="newUser.email" name="email" required placeholder="Enter username"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for login</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ editingMode() ? 'New Password (Optional)' : 'Password' }}
                        </label>
                        <input type="password" [(ngModel)]="newUser.password" name="password" 
                               [required]="!editingMode()" placeholder="••••••••"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <p *ngIf="editingMode()" class="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave blank to keep existing password. Changing it will log out this user from all devices.</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select [(ngModel)]="newUser.role" name="role" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent User / Manager</label>
                        <select [(ngModel)]="newUser.parentUserId" name="parentUserId" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option [ngValue]="null">None (Top Level User)</option>
                            <ng-container *ngFor="let u of users()">
                                <option *ngIf="u.id !== editingId()" [ngValue]="u.id">{{ u.name }} ({{ u.role }})</option>
                            </ng-container>
                        </select>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Assign a parent user to establish hierarchy</p>
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <button type="button" (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition font-medium">
                            Cancel
                        </button>
                        <button type="submit" [disabled]="loading()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium disabled:opacity-50 flex items-center gap-2">
                             <lucide-icon *ngIf="loading()" name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
                             {{ editingMode() ? 'Update' : 'Create' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>

      <!-- Permissions / Module Rights Modal -->
      <div *ngIf="showPermModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="closePermModal()"></div>

        <!-- Modal Box -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/80 shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <lucide-icon name="shield" class="h-5 w-5"></lucide-icon>
                </div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white">
                  User Module Rights & Permissions
                </h3>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Configuring permissions for: <strong class="text-gray-800 dark:text-gray-200">{{ selectedPermUser()?.name }}</strong> 
                <span [class]="selectedPermUser()?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'" class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                  {{ selectedPermUser()?.role }}
                </span>
              </p>
            </div>
            <button (click)="closePermModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
            </button>
          </div>

          <!-- Notice for Admin role -->
          <div *ngIf="selectedPermUser()?.role === 'admin'" class="px-6 py-2.5 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/40 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 shrink-0">
            <lucide-icon name="shield" class="h-4 w-4 shrink-0"></lucide-icon>
            <span>Note: Administrators hold full permissions across all modules by default. Setting custom permissions defines overrides or future policies.</span>
          </div>

          <!-- Quick Action Toolbar -->
          <div class="px-6 py-3 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">Quick Actions:</span>
              <button type="button" (click)="toggleAll(true)" class="px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-xs">
                Select All Operations
              </button>
              <button type="button" (click)="toggleAll(false)" class="px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-xs">
                Clear All
              </button>
            </div>

            <div class="flex items-center gap-1.5">
              <span class="text-gray-400 text-[11px]">Toggle Category:</span>
              <button type="button" (click)="toggleCategory('Core', true)" class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition">
                Core All
              </button>
              <button type="button" (click)="toggleCategory('Masters', true)" class="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium border border-purple-100 dark:border-purple-800 hover:bg-purple-100 transition">
                Masters All
              </button>
            </div>
          </div>

          <!-- Loading state -->
          <div *ngIf="permLoading()" class="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
            <lucide-icon name="loader-2" class="h-8 w-8 animate-spin text-indigo-600"></lucide-icon>
            <span class="text-sm">Loading module permissions...</span>
          </div>

          <!-- Permissions Matrix Module Cards -->
          <div *ngIf="!permLoading()" class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
            <div *ngFor="let mod of permissionsList()" class="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700/80 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition shadow-2xs">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100 dark:border-gray-700/60">
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" [checked]="isModuleAllChecked(mod)" (change)="toggleModuleRow(mod, $event)"
                           class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4">
                    <span class="font-bold text-gray-900 dark:text-white text-sm">{{ mod.moduleName }}</span>
                  </label>
                  <span [class]="mod.category === 'Core' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold">
                    {{ mod.category }}
                  </span>
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500 max-w-md truncate" title="{{ mod.description }}">
                  {{ mod.description }}
                </div>
              </div>

              <!-- Available Operations Badges / Checkboxes -->
              <div class="flex flex-wrap gap-2">
                @for (op of (mod.availableOperations || []); track op.key) {
                  <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition select-none"
                         [ngClass]="mod.operations?.[op.key] ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold' : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60'">
                    <input type="checkbox" 
                           [checked]="!!mod.operations?.[op.key]" 
                           (change)="onOperationToggle(mod, op.key, $event)"
                           class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5">
                    <span>{{ op.label }}</span>
                  </label>
                }
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 flex items-center justify-between shrink-0">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Changes take effect immediately on next page load or session sync.
            </div>
            <div class="flex items-center gap-3">
              <button type="button" (click)="closePermModal()" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition font-medium">
                Cancel
              </button>
              <button type="button" (click)="saveUserPermissions()" [disabled]="permSaving() || permLoading()" 
                      class="bg-indigo-600 text-white px-6 py-2 text-sm rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium disabled:opacity-50 flex items-center gap-2">
                <lucide-icon *ngIf="permSaving()" name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
                Save Rights & Permissions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  auth = inject(AuthService);
  taskService = inject(TaskService);
  toast = inject(ToastService);
  permissionService = inject(PermissionService);

  users = signal<User[]>([]);
  userStats = signal<any[]>([]);
  hierarchyTasks = signal<any[]>([]);
  loading = signal(false);

  // Permission Modal state
  showPermModal = signal(false);
  permLoading = signal(false);
  permSaving = signal(false);
  selectedPermUser = signal<User | null>(null);
  permissionsList = signal<ModulePermission[]>([]);

  newUser: Partial<User> = {
    role: 'user',
    name: '',
    email: '',
    password: ''
  };

  openPermissionsModal(user: User) {
    this.selectedPermUser.set(user);
    this.showPermModal.set(true);
    this.permLoading.set(true);
    this.permissionService.getUserPermissions(user.id).subscribe({
      next: (res) => {
        this.permissionsList.set(res.permissions || []);
        this.permLoading.set(false);
      },
      error: () => {
        this.toast.show('Failed to load user permissions', 'error');
        this.permLoading.set(false);
      }
    });
  }

  closePermModal() {
    this.showPermModal.set(false);
    this.selectedPermUser.set(null);
    this.permissionsList.set([]);
  }

  isModuleAllChecked(mod: ModulePermission): boolean {
    if (!mod.availableOperations || mod.availableOperations.length === 0) return false;
    return mod.availableOperations.every(op => !!mod.operations?.[op.key]);
  }

  toggleModuleRow(mod: ModulePermission, event: Event) {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    if (!mod.operations) mod.operations = {};
    for (const op of (mod.availableOperations || [])) {
      mod.operations[op.key] = checked;
    }
    this.syncBaseColumns(mod);
  }

  onOperationToggle(mod: ModulePermission, opKey: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    if (!mod.operations) mod.operations = {};
    mod.operations[opKey] = checked;

    // Dependency rules
    if (opKey === 'view' && !checked) {
      // Disabling view disables all operations for this module
      for (const op of (mod.availableOperations || [])) {
        mod.operations[op.key] = false;
      }
    } else if (opKey !== 'view' && checked) {
      // Enabling any operation requires view
      mod.operations['view'] = true;
    }

    this.syncBaseColumns(mod);
  }

  private syncBaseColumns(mod: ModulePermission) {
    const ops = mod.operations || {};
    mod.canView = !!ops['view'];
    mod.canAdd = !!(ops['add'] || ops['upload']);
    mod.canUpdate = !!(ops['edit'] || ops['update'] || ops['rename'] || ops['move']);
    mod.canDelete = !!ops['delete'];
  }

  toggleAll(checked: boolean) {
    this.permissionsList.update(list => list.map(m => {
      const ops: Record<string, boolean> = {};
      for (const op of (m.availableOperations || [])) {
        ops[op.key] = checked;
      }
      const updated = { ...m, operations: ops };
      this.syncBaseColumns(updated);
      return updated;
    }));
  }

  toggleCategory(category: string, checked: boolean) {
    this.permissionsList.update(list => list.map(m => {
      if (m.category !== category) return m;
      const ops: Record<string, boolean> = {};
      for (const op of (m.availableOperations || [])) {
        ops[op.key] = checked;
      }
      const updated = { ...m, operations: ops };
      this.syncBaseColumns(updated);
      return updated;
    }));
  }

  saveUserPermissions() {
    const user = this.selectedPermUser();
    if (!user) return;
    this.permSaving.set(true);
    this.permissionService.saveUserPermissions(user.id, this.permissionsList()).subscribe({
      next: () => {
        this.toast.show(`Rights & permissions saved for ${user.name}`, 'success');
        this.permSaving.set(false);
        this.closePermModal();
      },
      error: (err: any) => {
        this.toast.show(err.error?.message || 'Failed to save permissions', 'error');
        this.permSaving.set(false);
      }
    });
  }


  ngOnInit() {
    this.loadUsers();
    this.loadUserStats();
    this.loadHierarchyTasks();
  }

  loadUsers() {
    this.auth.getUsers().subscribe(users => {
      this.users.set(users);
    });
  }

  loadUserStats() {
    this.taskService.getUserTaskStats().subscribe(stats => {
      this.userStats.set(stats);
    });
  }

  loadHierarchyTasks() {
    this.taskService.getHierarchyTasksList().subscribe(tasks => {
      this.hierarchyTasks.set(tasks);
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Done':
      case 'Completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Review':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  // State for editing
  showModal = signal(false);
  editingMode = signal(false);
  editingId = signal<string | null>(null);

  openAddModal() {
    this.cancelEdit();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.cancelEdit();
  }

  // Populate form for editing
  editUser(user: User) {
    this.newUser = {
      name: user.name,
      email: user.email,
      role: user.role,
      parentUserId: user.parentUserId || null,
      password: '' // Keep empty, only send if changing
    };
    this.editingMode.set(true);
    this.editingId.set(user.id);
    this.showModal.set(true);
  }

  cancelEdit() {
    this.newUser = { role: 'user', name: '', email: '', password: '', parentUserId: null };
    this.editingMode.set(false);
    this.editingId.set(null);
  }

  saveUser() { // Renamed from createUser
    if (!this.newUser.name || !this.newUser.email) {
      this.toast.show('Name and Email are required', 'error');
      return;
    }

    if (!this.editingMode() && !this.newUser.password) {
      this.toast.show('Password is required for new users', 'error');
      return;
    }

    this.loading.set(true);

    if (this.editingMode() && this.editingId()) {
      const isSelf = this.editingId() === this.auth.currentUser()?.id;
      const isPasswordChanging = !!this.newUser.password;

      // Update
      const updatePayload: any = {
        id: this.editingId()!,
        name: this.newUser.name,
        role: this.newUser.role,
        parentUserId: this.newUser.parentUserId || null,
        password: this.newUser.password // Optional
      };

      this.auth.updateUser(updatePayload).subscribe({
        next: () => {
          if (isSelf && isPasswordChanging) {
            this.toast.show('Your password was changed. You have been logged out from all devices.', 'success', 5000);
            this.auth.forceLogout('Password updated. Please log in with your new password.');
          } else if (isPasswordChanging) {
            this.toast.show('User updated successfully. All active sessions for this user have been terminated.', 'success', 5000);
            this.resetForm();
          } else {
            this.toast.show('User updated successfully', 'success');
            this.resetForm();
          }
        },
        error: (err) => {
          this.toast.show(err.message, 'error');
          this.loading.set(false);
        }
      });
    } else {
      // Create
      const start = { ...this.newUser } as Omit<User, 'id'>;
      this.auth.register(start).subscribe({
        next: () => {
          this.toast.show('User created successfully', 'success');
          this.resetForm();
        },
        error: (err) => {
          this.toast.show(err.message, 'error');
          this.loading.set(false);
        }
      });
    }
  }

  deleteUser(user: User) {
    if (!confirm('Are you sure you want to delete ' + user.name + '?')) return;

    this.loading.set(true);
    this.auth.deleteUser(user.id).subscribe({
      next: () => {
        this.toast.show('User deleted successfully', 'success');
        this.loadUsers();
        this.loadUserStats();
        this.loadHierarchyTasks();
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.show(err.message, 'error');
        this.loading.set(false);
      }
    });
  }

  private resetForm() {
    this.loading.set(false);
    this.loadUsers();
    this.loadUserStats();
    this.loadHierarchyTasks();
    this.newUser = { role: 'user', name: '', email: '', password: '', parentUserId: null };
    this.editingMode.set(false);
    this.editingId.set(null);
  }
}
