import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { State } from '../../../core/models/state.model';
import { Country } from '../../../core/models/country.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import { PermissionService } from '../../../core/services/permission.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-state-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">State Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage states and link them to countries</p>
        </div>
        <button *ngIf="permissionService.canAdd('master_state')" (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add State
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">State Name</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Country</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Created At</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr *ngFor="let state of states(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ i + 1 }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{{ state.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-medium">
                  {{ state.countryName }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ state.createdAt | date:'mediumDate' }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button *ngIf="permissionService.canUpdate('master_state')" (click)="openModal(state)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Edit">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
                <button *ngIf="permissionService.canDelete('master_state')" (click)="deleteState(state)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="states().length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                <div class="flex flex-col items-center gap-2">
                   <lucide-icon name="map" class="h-8 w-8 text-gray-300"></lucide-icon>
                   <span>No states found. Click "Add State" to create one.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[85vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingState ? 'Edit State' : 'Add State' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
             <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Country</label>
              <select [(ngModel)]="stateForm.countryId" 
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
                <option [value]="0">Select Country</option>
                <option *ngFor="let country of countries()" [value]="country.id">{{ country.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State Name</label>
              <input [(ngModel)]="stateForm.name" type="text" placeholder="Enter state name" 
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition">
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
          <button (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
          <button (click)="saveState()" [disabled]=\"!stateForm.name || !stateForm.countryId\" 
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
            {{ editingState ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class StateListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);
  public permissionService = inject(PermissionService);

  states = signal<State[]>([]);
  countries = signal<Country[]>([]);
  isModalOpen = false;
  editingState: State | null = null;
  stateForm = { name: '', countryId: 0 };

  ngOnInit() {
    this.loadStates();
    this.loadCountries();
  }

  loadStates() {
    this.mastersService.getStates().subscribe({
      next: (data) => this.states.set(data),
      error: (err) => this.toast.show('Failed to load states', 'error')
    });
  }

  loadCountries() {
    this.mastersService.getCountries().subscribe({
      next: (data) => this.countries.set(data),
      error: (err) => this.toast.show('Failed to load countries', 'error')
    });
  }

  openModal(state?: State) {
    if (state) {
      this.editingState = state;
      this.stateForm = { name: state.name, countryId: state.countryId };
    } else {
      this.editingState = null;
      this.stateForm = { name: '', countryId: 0 };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingState = null;
    this.stateForm = { name: '', countryId: 0 };
  }

  saveState() {
    if (this.editingState) {
      this.mastersService.updateState({ ...this.editingState, name: this.stateForm.name, countryId: this.stateForm.countryId })
        .subscribe({
          next: () => {
            this.toast.show('State updated successfully');
            this.loadStates();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to update state', 'error')
        });
    } else {
      this.mastersService.createState(this.stateForm)
        .subscribe({
          next: () => {
            this.toast.show('State created successfully');
            this.loadStates();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to create state', 'error')
        });
    }
  }

  deleteState(state: State) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${state.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteState(state.id!).subscribe({
          next: () => {
            this.toast.show('State deleted successfully');
            this.loadStates();
          },
          error: (err) => {
             const errorMsg = err.error?.message || 'Failed to delete state';
             this.toast.show(errorMsg, 'error');
          }
        });
      }
    });
  }
}
