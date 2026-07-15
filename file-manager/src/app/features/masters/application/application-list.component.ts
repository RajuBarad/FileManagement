import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Application } from '../../../core/models/application.model';
import { Village } from '../../../core/models/village.model';
import { Channel } from '../../../core/models/channel.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { FileSystemService } from '../../../core/services/file-system.service';
import { FileSystemItem } from '../../../core/models/file-system.model';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule, DragDropModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Task Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage visitor tasks and locations</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- View Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            <button (click)="currentView.set('list')" 
                    [class.bg-white]="currentView() === 'list'" 
                    [class.shadow-sm]="currentView() === 'list'"
                    [class.text-blue-600]="currentView() === 'list'"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <lucide-icon name="list" class="h-3.5 w-3.5"></lucide-icon>
              List View
            </button>
            <button (click)="currentView.set('kanban')" 
                    [class.bg-white]="currentView() === 'kanban'" 
                    [class.shadow-sm]="currentView() === 'kanban'"
                    [class.text-blue-600]="currentView() === 'kanban'"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <lucide-icon name="layout-grid" class="h-3.5 w-3.5"></lucide-icon>
              Kanban Board
            </button>
          </div>

            <!-- Show Archived Toggle -->
            <label class="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-300 mr-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
              <input type="checkbox" #archiveCheck [checked]="showArchived()" (change)="showArchived.set(archiveCheck.checked)" 
                     class="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800 cursor-pointer">
              <span>Show Archived</span>
            </label>

            <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
              <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
              Add Task
            </button>
        </div>
      </div>

      <!-- List View (Table) -->
      <div *ngIf="currentView() === 'list'" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-in fade-in duration-200">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Sr No</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Visitor Details</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Location Hierarchy</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Channel</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Assignees</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let app of filteredApplications(); let i = index" 
                  [class.bg-green-50/40]="app.isCompleted || app.isClosed" 
                  [class.dark:bg-green-950/10]="app.isCompleted || app.isClosed"
                  [class.border-l-4]="app.isCompleted || app.isClosed"
                  [class.border-l-green-500]="app.isCompleted || app.isClosed"
                  class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ app.id }}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">{{ app.visitingDate | date:'dd/MM/yyyy' }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ app.visitorName }}</span>
                      <span *ngIf="app.isClosed" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400 border border-gray-200 dark:border-gray-700/30">
                        Closed
                      </span>
                      <div *ngIf="app.isCompleted && !app.isClosed" class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                        <span class="relative flex h-1.5 w-1.5">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        <span class="text-[9px] font-bold">Completed</span>
                      </div>
                    </div>
                    <span class="text-xs text-gray-500 flex items-center gap-1">
                      <lucide-icon name="phone" size="10"></lucide-icon>
                      {{ app.mobileNo }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ app.villageName }}</span>
                    <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      <span>{{ app.talukaName }}</span>
                      <lucide-icon name="chevron-right" size="10"></lucide-icon>
                      <span>{{ app.districtName }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm">
                  <span *ngIf="app.channelName" class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {{ app.channelName }}
                  </span>
                  <span *ngIf="!app.channelName" class="text-gray-400 text-xs italic">
                    Unassigned
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <div class="flex -space-x-1.5 overflow-hidden">
                    <ng-container *ngIf="app.assignees && app.assignees.length > 0">
                      <div *ngFor="let assignee of app.assignees.slice(0, 3)" class="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-white dark:border-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-[9px] select-none" title="{{assignee.name}}">
                        {{ assignee.name.charAt(0).toUpperCase() }}
                      </div>
                      <div *ngIf="app.assignees.length > 3" class="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 border border-white dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-[9px] select-none">
                        +{{ app.assignees.length - 3 }}
                      </div>
                    </ng-container>
                    <span *ngIf="!app.assignees || app.assignees.length === 0" class="text-gray-400 text-xs italic">Unassigned</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button (click)="openCommentsModal(app)" class="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition" title="Comments & Details">
                    <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button *ngIf="app.isClosed" (click)="reopenTask(app)" class="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition" title="Revert to Incomplete">
                    <lucide-icon name="rotate-ccw" class="h-4 w-4"></lucide-icon>
                  </button>
                  <ng-container *ngIf="!app.isClosed">
                    <button (click)="closeTask(app)" class="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition" title="Close Task & Archive">
                      <lucide-icon name="check-circle" class="h-4 w-4"></lucide-icon>
                    </button>
                    <button (click)="openModal(app)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Edit">
                      <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                    </button>
                    <button (click)="deleteApplication(app)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete">
                      <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                    </button>
                  </ng-container>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Kanban View -->
      <div *ngIf="currentView() === 'kanban'" class="overflow-x-auto min-h-[600px] pb-6 animate-in fade-in duration-200">
        <div class="flex gap-6 min-w-[1200px]" cdkDropListGroup>
          <!-- Dynamic Channels columns -->
          <div *ngFor="let col of channels()" class="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/50 rounded-xl min-w-[300px] max-h-[70vh]">
            <!-- Column Header -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl shrink-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-gray-700 dark:text-gray-200 text-sm">{{ col.name }}</span>
                <span *ngIf="col.isDefault" class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                  Default
                </span>
              </div>
              <span class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {{ getApplicationsForChannel(col.id!).length }}
              </span>
            </div>

            <!-- Column Body -->
            <div class="flex-1 p-4 overflow-y-auto space-y-3 min-h-[350px] custom-scrollbar"
                 cdkDropList [id]="'channel-' + col.id" [cdkDropListData]="getApplicationsForChannel(col.id!)"
                 (cdkDropListDropped)="onDrop($event)">
              
                <div *ngFor="let app of getApplicationsForChannel(col.id!)" cdkDrag [cdkDragData]="app" [cdkDragDisabled]="!!app.isClosed"
                     [class.border-green-600]="app.isClosed"
                     [class.bg-green-50/10]="app.isClosed"
                     [class.dark:bg-green-950/5]="app.isClosed"
                     [class.opacity-75]="app.isClosed"
                     [class.border-green-400]="app.isCompleted && !app.isClosed"
                     [class.border-t-4]="app.isCompleted && !app.isClosed"
                     [class.border-t-green-500]="app.isCompleted && !app.isClosed"
                     [class.bg-green-50/45]="app.isCompleted && !app.isClosed"
                     [class.dark:bg-green-950/15]="app.isCompleted && !app.isClosed"
                     [class.shadow-md]="app.isCompleted && !app.isClosed"
                     [class.shadow-green-100/50]="app.isCompleted && !app.isClosed"
                     class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 hover:shadow-md transition duration-200 group relative flex flex-col cursor-move">
                  
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-semibold text-gray-400 dark:text-gray-500">
                      {{ app.visitingDate | date:'dd/MM/yyyy' }}
                    </span>
                    
                    <div class="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition duration-150">
                      <button (click)="openCommentsModal(app)" class="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400" title="Comments & Details">
                        <lucide-icon name="message-square" class="h-3.5 w-3.5"></lucide-icon>
                      </button>
                      <button *ngIf="app.isClosed" (click)="reopenTask(app)" class="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded text-orange-600 dark:text-orange-400" title="Revert to Incomplete">
                        <lucide-icon name="rotate-ccw" class="h-3.5 w-3.5"></lucide-icon>
                      </button>
                      <ng-container *ngIf="!app.isClosed">
                        <button (click)="closeTask(app)" class="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400" title="Close Task & Archive">
                          <lucide-icon name="check-circle" class="h-3.5 w-3.5"></lucide-icon>
                        </button>
                        <button (click)="openModal(app)" class="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400" title="Edit">
                          <lucide-icon name="edit" class="h-3.5 w-3.5"></lucide-icon>
                        </button>
                        <button (click)="deleteApplication(app)" class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400" title="Delete">
                          <lucide-icon name="trash-2" class="h-3.5 w-3.5"></lucide-icon>
                        </button>
                      </ng-container>
                    </div>
                  </div>

                  <h3 (click)="openCommentsModal(app)" class="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1 hover:text-blue-600 cursor-pointer flex items-center justify-between" title="View comments & attachments">
                    <span>{{ app.visitorName }}</span>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span *ngIf="app.isClosed" class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-400 border border-gray-200 dark:border-gray-700/30">
                        Closed
                      </span>
                      <div *ngIf="app.isCompleted && !app.isClosed" class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                        <span class="relative flex h-1.5 w-1.5">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        <span class="text-[8px] font-bold">Completed</span>
                      </div>
                    </div>
                  </h3>
                
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
              <div *ngIf="getApplicationsForChannel(col.id!).length === 0" class="h-24 border border-dashed border-gray-200 dark:border-gray-700/60 rounded-xl flex items-center justify-center text-gray-400 text-xs italic">
                Drag tasks here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="isModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[75vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingApplication() ? 'Edit Task' : 'Add Task' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
             <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar">
          <!-- Locked Banner -->
          <div *ngIf="editingApplication()?.isClosed" class="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-lg flex items-center justify-between gap-3 text-green-800 dark:text-green-400 text-sm">
            <div class="flex items-center gap-2">
              <lucide-icon name="lock" class="h-4 w-4 shrink-0"></lucide-icon>
              <span class="font-semibold">This task is closed and locked. It is read-only.</span>
            </div>
            <button (click)="reopenTask(editingApplication()!); closeModal()" class="flex items-center gap-1.5 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs transition font-medium">
              <lucide-icon name="rotate-ccw" class="h-3.5 w-3.5"></lucide-icon>
              Reopen Task
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Sr No</label>
              <input type="text" [value]="editingApplication() ? editingApplication()!.id : '(Auto)'" disabled
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium cursor-not-allowed">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Visiting Date</label>
              <input [(ngModel)]="appForm.visitingDate" type="date" [disabled]="!!editingApplication()?.isClosed"
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition">
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Visitor Name</label>
            <input [(ngModel)]="appForm.visitorName" type="text" placeholder="Enter visitor name" [disabled]="!!editingApplication()?.isClosed"
                   class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile No</label>
              <input [(ngModel)]="appForm.mobileNo" type="text" placeholder="Mobile number" [disabled]="!!editingApplication()?.isClosed"
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Village</label>
              <select [ngModel]="selectedVillageId()" (ngModelChange)="onVillageChange($event)" [disabled]="!!editingApplication()?.isClosed"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer">
                <option [value]="0">Select Village</option>
                <option *ngFor="let v of villages()" [value]="v.id">{{ v.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Taluka (Auto)</label>
              <input [value]="selectedTalukaName()" type="text" disabled
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed">
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea [(ngModel)]="appForm.description" rows="3" placeholder="Description" [disabled]="!!editingApplication()?.isClosed"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"></textarea>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reference</label>
            <textarea [(ngModel)]="appForm.reference" rows="3" placeholder="Reference" [disabled]="!!editingApplication()?.isClosed"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"></textarea>
          </div>

          <div class="mb-2">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Assign Tasks To Users</label>
            <div class="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <div class="max-h-40 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                <label *ngFor="let user of users()" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition select-none">
                  <input type="checkbox" [checked]="isUserAssigned(user.id)" (change)="toggleUserAssignee(user.id)" [disabled]="!!editingApplication()?.isClosed"
                         class="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800">
                  <span class="text-sm text-gray-700 dark:text-gray-200 flex-1">{{ user.name }}</span>
                </label>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                <span class="text-gray-500 dark:text-gray-400">{{ assignedUserIds.length }} selected</span>
                <button *ngIf="assignedUserIds.length > 0 && !editingApplication()?.isClosed" (click)="assignedUserIds = []" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">Clear All</button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
          <button (click)="closeModal()" class="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Close</button>
          <button *ngIf="!editingApplication()?.isClosed" (click)="saveApplication()" [disabled]="!appForm.visitorName || !appForm.visitingDate || !selectedVillageId()" 
                  class="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
            {{ editingApplication() ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Comments Modal -->
    <div *ngIf="isCommentsModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeCommentsModal()"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <lucide-icon name="message-square" class="h-5 w-5 text-blue-600"></lucide-icon>
            Comments
          </h3>
          <button (click)="closeCommentsModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Application Details Card -->
          <div *ngIf="activeCommentsApplication() as app" class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
            <h4 class="font-semibold text-gray-800 dark:text-gray-200 text-lg">{{ app.visitorName }}</h4>
            <p class="text-gray-600 dark:text-gray-400 mt-1">{{ app.description || 'No description provided.' }}</p>
            <div class="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <lucide-icon name="users" class="h-3.5 w-3.5"></lucide-icon> 
                {{ app.assignees?.length || 0 }} Assignee(s)
              </span>
              <span class="flex items-center gap-1">
                <lucide-icon name="calendar" class="h-3.5 w-3.5"></lucide-icon> 
                {{ app.visitingDate | date:'dd/MM/yyyy' }}
              </span>
            </div>
          </div>

          <!-- Discussion Section -->
          <div class="space-y-4">
            <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <lucide-icon name="message-square" class="h-4 w-4"></lucide-icon>
              Discussion
            </h5>
            
            <!-- Comments List -->
            <div class="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
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
            <div class="space-y-2 mb-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
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
export class ApplicationListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fileService = inject(FileSystemService);

  applications = signal<Application[]>([]);
  villages = signal<Village[]>([]);
  channels = signal<Channel[]>([]);
  users = signal<User[]>([]);

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

  selectedVillageId = signal<number>(0);
  isModalOpen = signal<boolean>(false);
  editingApplication = signal<Application | null>(null);
  currentView = signal<'list' | 'kanban'>('kanban');
  assignedUserIds: number[] = [];
  showArchived = signal<boolean>(false);

  filteredApplications = computed(() => {
    const showAll = this.showArchived();
    return this.applications().filter(app => showAll || !app.isClosed);
  });

  appForm = {
    visitingDate: new Date().toISOString().split('T')[0],
    visitorName: '',
    mobileNo: '',
    description: '',
    reference: '',
    channelId: null as number | null
  };

  selectedTalukaName = computed(() => {
    const id = this.selectedVillageId();
    if (!id) return '';
    const village = this.villages().find(v => v.id === id);
    return village ? village.talukaName : '';
  });

  ngOnInit() {
    this.loadApplications();
    this.loadVillages();
    this.loadChannels();
    this.loadUsers();

    this.route.queryParams.subscribe(params => {
      const openId = params['openTaskId'];
      if (openId) {
        this.checkAndOpenApplication(Number(openId));
      }
    });

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
          this.searchResults.set(results.filter((f: FileSystemItem) => f.type !== 'folder')); // Only allow files
        });
    });
  }

  loadApplications() {
    this.mastersService.getApplications().subscribe({
      next: (data) => {
        this.applications.set(data);
        const openId = this.route.snapshot.queryParams['openTaskId'];
        if (openId) {
          this.checkAndOpenApplication(Number(openId));
        }
      },
      error: () => this.toast.show('Failed to load tasks', 'error')
    });
  }

  checkAndOpenApplication(appId: number) {
    const app = this.applications().find(a => a.id === appId);
    if (app) {
      this.openModal(app);
      // Clean up query param so clicking again works
      this.router.navigate([], {
        queryParams: { openTaskId: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  loadVillages() {
    this.mastersService.getVillages().subscribe({
      next: (data) => this.villages.set(data),
      error: () => this.toast.show('Failed to load villages', 'error')
    });
  }

  loadChannels() {
    this.mastersService.getChannels().subscribe({
      next: (data) => this.channels.set(data),
      error: () => this.toast.show('Failed to load channels', 'error')
    });
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.toast.show('Failed to load users', 'error')
    });
  }

  getApplicationsForChannel(channelId: number): Application[] {
    return this.filteredApplications().filter(app => app.channelId === channelId);
  }

  onVillageChange(id: any) {
    this.selectedVillageId.set(Number(id));
  }

  isUserAssigned(userId: string | number): boolean {
    return this.assignedUserIds.includes(Number(userId));
  }

  toggleUserAssignee(userId: string | number) {
    const numId = Number(userId);
    if (this.isUserAssigned(numId)) {
      this.assignedUserIds = this.assignedUserIds.filter(id => id !== numId);
    } else {
      this.assignedUserIds.push(numId);
    }
  }

  openModal(app?: Application) {
    if (app) {
      this.editingApplication.set(app);
      this.selectedVillageId.set(app.villageId);
      this.assignedUserIds = app.assignees ? app.assignees.map(a => Number(a.id)) : [];
      this.appForm = {
        visitingDate: app.visitingDate,
        visitorName: app.visitorName,
        mobileNo: app.mobileNo,
        description: app.description,
        reference: app.reference,
        channelId: app.channelId || null
      };
    } else {
      this.editingApplication.set(null);
      this.selectedVillageId.set(0);
      this.assignedUserIds = [];
      
      const defaultChannel = this.channels().find(c => c.isDefault);
      this.appForm = {
        visitingDate: new Date().toISOString().split('T')[0],
        visitorName: '',
        mobileNo: '',
        description: '',
        reference: '',
        channelId: defaultChannel ? (defaultChannel.id || null) : null
      };
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingApplication.set(null);
  }

  saveApplication() {
    const payload = { 
      ...this.appForm, 
      villageId: this.selectedVillageId(),
      id: this.editingApplication()?.id,
      assignedToUserIds: this.assignedUserIds
    } as any;

    if (this.editingApplication()) {
      this.mastersService.updateApplication(payload).subscribe({
        next: () => {
          this.toast.show('Task updated successfully');
          this.loadApplications();
          this.closeModal();
        },
        error: () => this.toast.show('Failed to update task', 'error')
      });
    } else {
      this.mastersService.createApplication(payload).subscribe({
        next: () => {
          this.toast.show('Task created successfully');
          this.loadApplications();
          this.closeModal();
        },
        error: () => this.toast.show('Failed to create task', 'error')
      });
    }
  }

  onDrop(event: CdkDragDrop<Application[]>) {
    if (event.previousContainer !== event.container) {
      const app = event.item.data as Application;
      const destChannelIdStr = event.container.id.replace('channel-', '');
      const destChannelId = destChannelIdStr ? Number(destChannelIdStr) : null;
      
      const currentApps = this.applications().map(a => {
        if (a.id === app.id) {
          return { ...a, channelId: destChannelId };
        }
        return a;
      });
      this.applications.set(currentApps);
      
      this.mastersService.updateApplicationChannel(app.id!, destChannelId).subscribe({
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

  deleteApplication(app: Application) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete task for ${app.visitorName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteApplication(app.id!).subscribe({
          next: () => {
            this.toast.show('Task deleted successfully');
            this.loadApplications();
          },
          error: (err) => this.toast.show(err.error?.message || 'Failed to delete task', 'error')
        });
      }
    });
  }

  closeTask(app: Application) {
    if (!app.id) return;
    Swal.fire({
      title: 'Close & Archive Task?',
      text: `Are you sure you want to close the task for "${app.visitorName}"? This will archive it and lock it from further editing.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, close it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.closeApplication(app.id!).subscribe({
          next: () => {
            this.toast.show('Task closed and archived');
            this.loadApplications();
          },
          error: (err) => this.toast.show(err.error?.message || 'Failed to close task', 'error')
        });
      }
    });
  }

  reopenTask(app: Application) {
    if (!app.id) return;
    Swal.fire({
      title: 'Reopen Task?',
      text: `Are you sure you want to revert the task for "${app.visitorName}" back to incomplete? This will move it out of the archive and make it active again.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, reopen it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.reopenApplication(app.id!).subscribe({
          next: () => {
            this.toast.show('Task reopened successfully');
            this.loadApplications();
          },
          error: (err) => this.toast.show(err.error?.message || 'Failed to reopen task', 'error')
        });
      }
    });
  }

  // Comments & Attachments Methods
  openCommentsModal(app: Application) {
    this.activeCommentsApplication.set(app);
    this.newComment = '';
    this.searchQuery = '';
    this.comments.set([]);
    this.attachments.set([]);
    this.searchResults.set([]);
    this.loadApplicationComments();
    this.loadApplicationAttachments();
    this.isCommentsModalOpen.set(true);
  }

  closeCommentsModal() {
    this.isCommentsModalOpen.set(false);
    this.activeCommentsApplication.set(null);
  }

  loadApplicationComments() {
    const app = this.activeCommentsApplication();
    if (app && app.id) {
      this.mastersService.getApplicationComments(app.id).subscribe({
        next: (c) => this.comments.set(c),
        error: () => this.toast.show('Failed to load comments', 'error')
      });
    }
  }

  loadApplicationAttachments() {
    const app = this.activeCommentsApplication();
    if (app && app.id) {
      this.mastersService.getApplicationAttachments(app.id).subscribe({
        next: (a) => this.attachments.set(a),
        error: () => this.toast.show('Failed to load attachments', 'error')
      });
    }
  }

  addComment() {
    const app = this.activeCommentsApplication();
    const userId = this.authService.currentUser()?.id;
    if (!this.newComment.trim() || !app || !app.id || !userId) return;

    this.mastersService.addApplicationComment(app.id, userId, this.newComment).subscribe({
      next: () => {
        this.newComment = '';
        this.loadApplicationComments();
      },
      error: () => this.toast.show('Failed to add comment', 'error')
    });
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  attachFile(file: FileSystemItem) {
    const app = this.activeCommentsApplication();
    if (!app || !app.id) return;

    this.mastersService.attachApplicationFile(app.id, file.id).subscribe({
      next: () => {
        this.loadApplicationAttachments();
        this.searchQuery = '';
        this.searchResults.set([]);
      },
      error: (err) => {
        if (err.status === 409) {
          this.toast.show('File already attached', 'warning');
        } else {
          this.toast.show('Failed to attach file', 'error');
        }
      }
    });
  }

  removeAttachment(attachmentId: string) {
    this.mastersService.removeApplicationAttachment(attachmentId).subscribe({
      next: () => {
        this.loadApplicationAttachments();
      },
      error: () => this.toast.show('Failed to remove attachment', 'error')
    });
  }

  downloadAttachment(file: any) {
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
}
