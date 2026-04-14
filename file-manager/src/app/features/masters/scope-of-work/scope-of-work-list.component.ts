import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { ScopeOfWork } from '../../../core/models/scope-of-work.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-scope-of-work-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Scope of Work Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage different types of work scopes</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add Scope
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Created At</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr *ngFor="let item of scopes(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ i + 1 }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{{ item.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ item.createdAt | date:'mediumDate' }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button (click)="openModal(item)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
                <button (click)="deleteScope(item)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="scopes().length === 0">
              <td colspan="4" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                <div class="flex flex-col items-center gap-2">
                   <lucide-icon name="layout-grid" class="h-8 w-8 text-gray-300"></lucide-icon>
                   <span>No scopes of work found. Click "Add Scope" to create one.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
      
      <!-- Modal Window -->
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[85vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <!-- Header (Fixed) -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingScope ? 'Edit Scope of Work' : 'Add Scope of Work' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
               <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
            </button>
          </div>
          
          <!-- Content (Scrollable) -->
          <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope Name</label>
              <input [(ngModel)]="scopeForm.name" type="text" placeholder="Enter scope name" 
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
            </div>
          </div>

          <!-- Footer (Fixed) -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
            <button (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
            <button (click)="saveScope()" [disabled]="!scopeForm.name" 
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
              {{ editingScope ? 'Update' : 'Save' }}
            </button>
        </div>
      </div>
    </div>
  `
})
export class ScopeOfWorkListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  scopes = signal<ScopeOfWork[]>([]);
  isModalOpen = false;
  editingScope: ScopeOfWork | null = null;
  scopeForm = { name: '' };

  ngOnInit() {
    this.loadScopes();
  }

  loadScopes() {
    this.mastersService.getScopesOfWork().subscribe({
      next: (data) => this.scopes.set(data),
      error: (err) => this.toast.show('Failed to load scopes of work', 'error')
    });
  }

  openModal(scope?: ScopeOfWork) {
    if (scope) {
      this.editingScope = scope;
      this.scopeForm = { name: scope.name };
    } else {
      this.editingScope = null;
      this.scopeForm = { name: '' };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingScope = null;
    this.scopeForm = { name: '' };
  }

  saveScope() {
    if (this.editingScope) {
      this.mastersService.updateScopeOfWork({ ...this.editingScope, name: this.scopeForm.name })
        .subscribe({
          next: () => {
            this.toast.show('Scope of work updated successfully');
            this.loadScopes();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to update scope of work', 'error')
        });
    } else {
      this.mastersService.createScopeOfWork(this.scopeForm)
        .subscribe({
          next: () => {
            this.toast.show('Scope of work created successfully');
            this.loadScopes();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to create scope of work', 'error')
        });
    }
  }

  deleteScope(scope: ScopeOfWork) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${scope.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteScopeOfWork(scope.id!).subscribe({
          next: () => {
            this.toast.show('Scope of work deleted successfully');
            this.loadScopes();
          },
          error: (err) => this.toast.show('Failed to delete scope of work', 'error')
        });
      }
    });
  }
}
