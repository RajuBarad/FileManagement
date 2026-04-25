import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { District } from '../../../core/models/district.model';
import { State } from '../../../core/models/state.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-district-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">District Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage districts and link them to states</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add District
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">District Name</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">State</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Created At</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr *ngFor="let district of districts(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ i + 1 }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{{ district.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs font-medium">
                  {{ district.stateName }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ district.createdAt | date:'mediumDate' }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button (click)="openModal(district)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
                <button (click)="deleteDistrict(district)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="districts().length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                <div class="flex flex-col items-center gap-2">
                   <lucide-icon name="navigation" class="h-8 w-8 text-gray-300"></lucide-icon>
                   <span>No districts found. Click "Add District" to create one.</span>
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
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingDistrict ? 'Edit District' : 'Add District' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
             <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select State</label>
              <select [(ngModel)]="districtForm.stateId" 
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
                <option [value]="0">Select State</option>
                <option *ngFor="let state of states()" [value]="state.id">{{ state.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District Name</label>
              <input [(ngModel)]="districtForm.name" type="text" placeholder="Enter district name" 
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition">
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
          <button (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
          <button (click)="saveDistrict()" [disabled]=\"!districtForm.name || !districtForm.stateId\" 
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
            {{ editingDistrict ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class DistrictListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  districts = signal<District[]>([]);
  states = signal<State[]>([]);
  isModalOpen = false;
  editingDistrict: District | null = null;
  districtForm = { name: '', stateId: 0 };

  ngOnInit() {
    this.loadDistricts();
    this.loadStates();
  }

  loadDistricts() {
    this.mastersService.getDistricts().subscribe({
      next: (data) => this.districts.set(data),
      error: (err) => this.toast.show('Failed to load districts', 'error')
    });
  }

  loadStates() {
    this.mastersService.getStates().subscribe({
      next: (data) => this.states.set(data),
      error: (err) => this.toast.show('Failed to load states', 'error')
    });
  }

  openModal(district?: District) {
    if (district) {
      this.editingDistrict = district;
      this.districtForm = { name: district.name, stateId: district.stateId };
    } else {
      this.editingDistrict = null;
      this.districtForm = { name: '', stateId: 0 };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingDistrict = null;
    this.districtForm = { name: '', stateId: 0 };
  }

  saveDistrict() {
    if (this.editingDistrict) {
      this.mastersService.updateDistrict({ ...this.editingDistrict, name: this.districtForm.name, stateId: this.districtForm.stateId })
        .subscribe({
          next: () => {
            this.toast.show('District updated successfully');
            this.loadDistricts();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to update district', 'error')
        });
    } else {
      this.mastersService.createDistrict(this.districtForm)
        .subscribe({
          next: () => {
            this.toast.show('District created successfully');
            this.loadDistricts();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to create district', 'error')
        });
    }
  }

  deleteDistrict(district: District) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${district.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteDistrict(district.id!).subscribe({
          next: () => {
            this.toast.show('District deleted successfully');
            this.loadDistricts();
          },
          error: (err) => {
             const errorMsg = err.error?.message || 'Failed to delete district';
             this.toast.show(errorMsg, 'error');
          }
        });
      }
    });
  }
}
