import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Client } from '../../../core/models/client.model';
import { Village } from '../../../core/models/village.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Client Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage client contact details and locations</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add Client
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Client Details</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Location</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Address</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let client of clients(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ i + 1 }}</td>
                <td class="px-6 py-4 border-l-4 border-transparent hover:border-blue-500 transition-all">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{ client.name }}</span>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs text-gray-500 flex items-center gap-1" *ngIf="client.mobileNo">
                        <lucide-icon name="phone" class="h-3 w-3"></lucide-icon>
                        {{ client.mobileNo }}
                      </span>
                      <span class="text-xs text-gray-500 flex items-center gap-1" *ngIf="client.email">
                        <lucide-icon name="mail" class="h-3 w-3"></lucide-icon>
                        {{ client.email }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300" *ngIf="client.villageName">
                      {{ client.villageName }}
                    </span>
                    <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-400" *ngIf="client.talukaName">
                      <span>{{ client.talukaName }}</span>
                      <lucide-icon name="chevron-right" size="10"></lucide-icon>
                      <span>{{ client.districtName }}</span>
                    </div>
                    <span class="text-xs text-gray-400 italic" *ngIf="!client.villageName">Not set</span>
                  </div>
                </td>
                <td class="px-6 py-4 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                   <span class="text-sm text-gray-500 dark:text-gray-400" [title]="client.address || ''">{{ client.address || 'N/A' }}</span>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button (click)="openModal(client)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                    <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button (click)="deleteClient(client)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                    <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="clients().length === 0">
                <td colspan="5" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center gap-2">
                     <lucide-icon name="users" class="h-8 w-8 text-gray-300"></lucide-icon>
                     <span>No clients found. Click "Add Client" to create one.</span>
                  </div>
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
      
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[75vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingClient() ? 'Edit Client' : 'Add Client' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
               <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar">
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
              <input [(ngModel)]="clientForm.name" type="text" placeholder="Enter full client name" 
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile No</label>
                <div class="relative">
                  <lucide-icon name="phone" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-icon>
                  <input [(ngModel)]="clientForm.mobileNo" type="text" placeholder="Mobile range" 
                         class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition">
                </div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <div class="relative">
                  <lucide-icon name="mail" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></lucide-icon>
                  <input [(ngModel)]="clientForm.email" type="email" placeholder="client@example.com" 
                       class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition">
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Village</label>
                <select [ngModel]="selectedVillageId()" (ngModelChange)="onVillageChange($event)"
                        class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer">
                  <option [value]="0">Select Village</option>
                  <option *ngFor="let v of villages()" [value]="v.id">{{ v.name }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Taluka (Auto)</label>
                <input [value]="hierarchy().talukaName" type="text" disabled placeholder="Select village to auto-fill"
                       class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium cursor-not-allowed">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">District (Auto)</label>
                <input [value]="hierarchy().districtName" type="text" disabled
                       class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium cursor-not-allowed">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">State (Auto)</label>
                <input [value]="hierarchy().stateName" type="text" disabled
                       class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-500 font-medium cursor-not-allowed">
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Address</label>
              <textarea [(ngModel)]="clientForm.address" rows="3" placeholder="Enter street address, landmarks etc." 
                        class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"></textarea>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
            <button (click)="closeModal()" class="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
            <button (click)="saveClient()" [disabled]="!clientForm.name || !selectedVillageId()" 
                    class="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
              {{ editingClient() ? 'Update' : 'Save' }}
            </button>
        </div>
      </div>
    </div>
  `
})
export class ClientListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  clients = signal<Client[]>([]);
  villages = signal<Village[]>([]);
  selectedVillageId = signal<number>(0);
  isModalOpen = signal<boolean>(false);
  editingClient = signal<Client | null>(null);
  clientForm = { name: '', mobileNo: '', email: '', address: '' };

  hierarchy = computed(() => {
    const id = this.selectedVillageId();
    if (!id) return { talukaName: '', districtName: '', stateName: '' };
    const village = this.villages().find(v => v.id === id);
    return {
      talukaName: village?.talukaName || '',
      districtName: village?.districtName || '',
      stateName: village?.stateName || ''
    };
  });

  ngOnInit() {
    this.loadClients();
    this.loadVillages();
  }

  loadClients() {
    this.mastersService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => this.toast.show('Failed to load clients', 'error')
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

  openModal(client?: Client) {
    if (client) {
      this.editingClient.set(client);
      this.selectedVillageId.set(client.villageId || 0);
      this.clientForm = {
        name: client.name,
        mobileNo: client.mobileNo || '',
        email: client.email || '',
        address: client.address || ''
      };
    } else {
      this.editingClient.set(null);
      this.selectedVillageId.set(0);
      this.clientForm = { name: '', mobileNo: '', email: '', address: '' };
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingClient.set(null);
  }

  saveClient() {
    const payload = {
      ...this.clientForm,
      villageId: this.selectedVillageId(),
      id: this.editingClient()?.id
    } as any;

    if (this.editingClient()) {
      this.mastersService.updateClient(payload)
        .subscribe({
          next: () => {
            this.toast.show('Client updated successfully');
            this.loadClients();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to update client', 'error')
        });
    } else {
      this.mastersService.createClient(payload)
        .subscribe({
          next: () => {
            this.toast.show('Client created successfully');
            this.loadClients();
            this.closeModal();
          },
          error: (err) => this.toast.show('Failed to create client', 'error')
        });
    }
  }

  deleteClient(client: Client) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${client.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteClient(client.id!).subscribe({
          next: () => {
            this.toast.show('Client deleted successfully');
            this.loadClients();
          },
          error: (err) => this.toast.show('Failed to delete client', 'error')
        });
      }
    });
  }
}
