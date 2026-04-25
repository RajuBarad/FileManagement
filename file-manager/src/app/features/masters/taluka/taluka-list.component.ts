import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Taluka } from '../../../core/models/taluka.model';
import { District } from '../../../core/models/district.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-taluka-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Taluka Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage talukas and administrative zones</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add Taluka
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Taluka Name</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">District</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Created At</th>
              <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr *ngFor="let taluka of talukas(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ i + 1 }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">{{ taluka.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                <span class="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                  {{ taluka.districtName }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ taluka.createdAt | date:'mediumDate' }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button (click)="openModal(taluka)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                  <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                </button>
                <button (click)="deleteTaluka(taluka)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="talukas().length === 0">
              <td colspan="5" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                <div class="flex flex-col items-center gap-2">
                   <lucide-icon name="map-pin" class="h-8 w-8 text-gray-300"></lucide-icon>
                   <span>No talukas found. Click "Add Taluka" to create one.</span>
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
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingTaluka ? 'Edit Taluka' : 'Add Taluka' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
             <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        
        <!-- Content (Scrollable) -->
        <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar">
          <div class="space-y-4">
            <!-- District Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select District</label>
              <select [(ngModel)]="talukaForm.districtId" 
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
                <option [value]="0">Select District</option>
                <option *ngFor="let dist of districts()" [value]="dist.id">{{ dist.name }}</option>
              </select>
            </div>

            <!-- Taluka Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taluka Name</label>
              <input [(ngModel)]="talukaForm.name" type="text" placeholder="Enter taluka name" 
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition">
            </div>
          </div>
        </div>

        <!-- Footer (Fixed) -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
          <button (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
          <button (click)="saveTaluka()" [disabled]="!talukaForm.name || !talukaForm.districtId" 
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
            {{ editingTaluka ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TalukaListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  talukas = signal<Taluka[]>([]);
  districts = signal<District[]>([]);
  isModalOpen = false;
  editingTaluka: Taluka | null = null;
  talukaForm = { name: '', districtId: 0 };

  ngOnInit() {
    this.loadTalukas();
    this.loadDistricts();
  }

  loadTalukas() {
    this.mastersService.getTalukas().subscribe({
      next: (data) => this.talukas.set(data),
      error: (err) => this.toast.show('Failed to load talukas', 'error')
    });
  }

  loadDistricts() {
    this.mastersService.getDistricts().subscribe({
      next: (data) => this.districts.set(data),
      error: (err) => this.toast.show('Failed to load districts', 'error')
    });
  }

  openModal(taluka?: Taluka) {
    if (taluka) {
      this.editingTaluka = taluka;
      this.talukaForm = { name: taluka.name, districtId: taluka.districtId };
    } else {
      this.editingTaluka = null;
      this.talukaForm = { name: '', districtId: 0 };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingTaluka = null;
    this.talukaForm = { name: '', districtId: 0 };
  }

  saveTaluka() {
    if (this.editingTaluka) {
      this.mastersService.updateTaluka({ ...this.editingTaluka, name: this.talukaForm.name, districtId: this.talukaForm.districtId })
        .subscribe({
          next: () => {
            this.toast.show('Taluka updated successfully');
            this.loadTalukas();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to update taluka', 'error')
        });
    } else {
      this.mastersService.createTaluka(this.talukaForm)
        .subscribe({
          next: () => {
            this.toast.show('Taluka created successfully');
            this.loadTalukas();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to create taluka', 'error')
        });
    }
  }

  deleteTaluka(taluka: Taluka) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${taluka.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteTaluka(taluka.id!).subscribe({
          next: () => {
            this.toast.show('Taluka deleted successfully');
            this.loadTalukas();
          },
          error: (err) => {
             const errorMsg = err.error?.message || 'Failed to delete taluka';
             this.toast.show(errorMsg, 'error');
          }
        });
      }
    });
  }
}
