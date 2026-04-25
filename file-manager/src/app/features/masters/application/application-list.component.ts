import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Application } from '../../../core/models/application.model';
import { Village } from '../../../core/models/village.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Task Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage visitor tasks and locations</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add Task
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Sr No</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Visitor Details</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Location Hierarchy</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let app of applications(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ app.id }}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-medium">{{ app.visitingDate | date:'dd/MM/yyyy' }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ app.visitorName }}</span>
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
                <td class="px-6 py-4 text-right space-x-2">
                  <button (click)="openModal(app)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                    <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button (click)="deleteApplication(app)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
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
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[75vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingApplication() ? 'Edit Task' : 'Add Task' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
             <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Sr No</label>
              <input type="text" [value]="editingApplication() ? editingApplication()!.id : '(Auto)'" disabled
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium cursor-not-allowed">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Visiting Date</label>
              <input [(ngModel)]="appForm.visitingDate" type="date"
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition">
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Visitor Name</label>
            <input [(ngModel)]="appForm.visitorName" type="text" placeholder="Enter visitor name"
                   class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile No</label>
              <input [(ngModel)]="appForm.mobileNo" type="text" placeholder="Mobile number"
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Village</label>
              <select [ngModel]="selectedVillageId()" (ngModelChange)="onVillageChange($event)"
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
            <textarea [(ngModel)]="appForm.description" rows="3" placeholder="Description"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"></textarea>
          </div>

          <div class="mb-2">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reference</label>
            <textarea [(ngModel)]="appForm.reference" rows="3" placeholder="Reference"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
          <button (click)="closeModal()" class="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Close</button>
          <button (click)="saveApplication()" [disabled]="!appForm.visitorName || !appForm.visitingDate || !selectedVillageId()" 
                  class="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
            {{ editingApplication() ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ApplicationListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  applications = signal<Application[]>([]);
  villages = signal<Village[]>([]);
  selectedVillageId = signal<number>(0);
  isModalOpen = signal<boolean>(false);
  editingApplication = signal<Application | null>(null);

  appForm = {
    visitingDate: new Date().toISOString().split('T')[0],
    visitorName: '',
    mobileNo: '',
    description: '',
    reference: ''
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
  }

  loadApplications() {
    this.mastersService.getApplications().subscribe({
      next: (data) => this.applications.set(data),
      error: () => this.toast.show('Failed to load tasks', 'error')
    });
  }

  loadVillages() {
    this.mastersService.getVillages().subscribe({
      next: (data) => this.villages.set(data),
      error: () => this.toast.show('Failed to load villages', 'error')
    });
  }

  onVillageChange(id: any) {
    this.selectedVillageId.set(Number(id));
  }

  openModal(app?: Application) {
    if (app) {
      this.editingApplication.set(app);
      this.selectedVillageId.set(app.villageId);
      this.appForm = {
        visitingDate: app.visitingDate,
        visitorName: app.visitorName,
        mobileNo: app.mobileNo,
        description: app.description,
        reference: app.reference
      };
    } else {
      this.editingApplication.set(null);
      this.selectedVillageId.set(0);
      this.appForm = {
        visitingDate: new Date().toISOString().split('T')[0],
        visitorName: '',
        mobileNo: '',
        description: '',
        reference: ''
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
      id: this.editingApplication()?.id 
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
}
