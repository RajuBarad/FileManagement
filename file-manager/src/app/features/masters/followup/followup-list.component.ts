import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Followup } from '../../../core/models/followup.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';
import { DragDropModule, moveItemInArray, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-followup-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule, DragDropModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Followup Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage followups and notification reminder settings</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add Followup
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 w-16">#</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Followup Name</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Reminder Days</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700" cdkDropList (cdkDropListDropped)="drop($event)">
              <tr *ngFor="let followup of followups(); let i = index" cdkDrag class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition bg-white dark:bg-gray-800">
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex items-center gap-2">
                    <lucide-icon name="grip-vertical" class="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" cdkDragHandle></lucide-icon>
                    <span>{{ i + 1 }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                  <div class="flex items-center gap-2">
                    <span>{{ followup.name }}</span>
                    <span *ngIf="followup.isDefault" class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                      Default
                    </span>
                    <span *ngIf="followup.isCompleted" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
                      Completed
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                     {{ followup.reminderDays }} days
                  </span>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button (click)="openModal(followup)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                    <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button (click)="deleteFollowup(followup)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                    <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="isModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingFollowup() ? 'Edit Followup' : 'Add Followup' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
             <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        
        <div class="p-6 bg-white dark:bg-gray-800">
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Followup Name</label>
            <input [(ngModel)]="followupForm.name" type="text" placeholder="Enter followup name"
                   class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reminder Days</label>
            <input [(ngModel)]="followupForm.reminderDays" type="number" placeholder="Enter days"
                   class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm">
          </div>
          <div class="mb-4 flex items-center gap-2">
            <input [(ngModel)]="followupForm.isDefault" type="checkbox" id="isDefault"
                   class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700">
            <label for="isDefault" class="text-sm font-semibold text-gray-700 dark:text-gray-300">Set as Default Followup</label>
          </div>
          <div class="mb-6 flex items-center gap-2">
            <input [(ngModel)]="followupForm.isCompleted" type="checkbox" id="isCompleted"
                   class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700">
            <label for="isCompleted" class="text-sm font-semibold text-gray-700 dark:text-gray-300">Set as Completed Followup</label>
          </div>
          
          <div class="flex justify-end gap-3 mt-2">
            <button (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
            <button (click)="saveFollowup()" [disabled]="!followupForm.name" 
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
              {{ editingFollowup() ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cdk-drag-preview {
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      background: white;
      display: table;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class FollowupListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  followups = signal<Followup[]>([]);
  isModalOpen = signal<boolean>(false);
  editingFollowup = signal<Followup | null>(null);
  followupForm = { name: '', reminderDays: 0, isDefault: false, isCompleted: false };

  ngOnInit() {
    this.loadFollowups();
  }

  loadFollowups() {
    this.mastersService.getFollowups().subscribe({
      next: (data) => this.followups.set(data),
      error: () => this.toast.show('Failed to load followups', 'error')
    });
  }

  openModal(followup?: Followup) {
    if (followup) {
      this.editingFollowup.set(followup);
      this.followupForm = { name: followup.name, reminderDays: followup.reminderDays, isDefault: !!followup.isDefault, isCompleted: !!followup.isCompleted };
    } else {
      this.editingFollowup.set(null);
      this.followupForm = { name: '', reminderDays: 0, isDefault: false, isCompleted: false };
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingFollowup.set(null);
  }

  saveFollowup() {
    if (this.editingFollowup()) {
      this.mastersService.updateFollowup({ ...this.editingFollowup()!, ...this.followupForm }).subscribe({
        next: () => {
          this.toast.show('Followup updated successfully');
          this.loadFollowups();
          this.closeModal();
        },
        error: () => this.toast.show('Failed to update followup', 'error')
      });
    } else {
      const newFollowupData = {
        ...this.followupForm,
        sequence: this.followups().length + 1
      };
      this.mastersService.createFollowup(newFollowupData).subscribe({
        next: () => {
          this.toast.show('Followup created successfully');
          this.loadFollowups();
          this.closeModal();
        },
        error: () => this.toast.show('Failed to create followup', 'error')
      });
    }
  }

  drop(event: CdkDragDrop<Followup[]>) {
    const followupsList = [...this.followups()];
    moveItemInArray(followupsList, event.previousIndex, event.currentIndex);
    
    // Update local state immediately for snappy UI
    this.followups.set(followupsList);
    
    // Send updated sequences to backend
    const ids = followupsList.map(f => f.id!).filter(id => id !== undefined);
    this.mastersService.updateFollowupSequences(ids).subscribe({
      next: () => {
        this.toast.show('Arrangement saved successfully');
      },
      error: () => {
        this.toast.show('Failed to save arrangement', 'error');
        this.loadFollowups(); // Revert back on error
      }
    });
  }

  deleteFollowup(followup: Followup) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete followup ${followup.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteFollowup(followup.id!).subscribe({
          next: () => {
            this.toast.show('Followup deleted successfully');
            this.loadFollowups();
          },
          error: (err) => this.toast.show(err.error?.message || 'Failed to delete followup', 'error')
        });
      }
    });
  }
}
