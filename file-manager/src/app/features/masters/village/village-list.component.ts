import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Village } from '../../../core/models/village.model';
import { Taluka } from '../../../core/models/taluka.model';
import { District } from '../../../core/models/district.model';
import { State } from '../../../core/models/state.model';
import { Country } from '../../../core/models/country.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-village-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Village Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage villages and administrative hierarchy</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add Village
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Village Name</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Administrative Hierarchy</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Created At</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let village of villages(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ i + 1 }}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{{ village.name }}</td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1.5 items-center text-xs">
                    <span class="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                      {{ village.talukaName }}
                    </span>
                    <lucide-icon name="chevron-right" size="12" class="text-gray-400"></lucide-icon>
                    <span class="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                      {{ village.districtName }}
                    </span>
                    <lucide-icon name="chevron-right" size="12" class="text-gray-400"></lucide-icon>
                    <span class="px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">
                      {{ village.stateName }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ village.createdAt | date:'mediumDate' }}</td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button (click)="openModal(village)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                    <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button (click)="deleteVillage(village)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                    <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="villages().length === 0">
                <td colspan="5" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center gap-2">
                    <lucide-icon name="home" class="h-8 w-8 text-gray-300"></lucide-icon>
                    <span>No villages found. Click "Add Village" to create one.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[85vh] shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden z-10 text-left">
        
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingVillage ? 'Edit Village' : 'Add Village' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800 custom-scrollbar space-y-4">
          <!-- Hierarchy Cascade -->
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Country</label>
              <select [(ngModel)]="selection.countryId" (change)="onCountryChange()"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer text-sm">
                <option [value]="0">Select Country</option>
                <option *ngFor="let c of countries()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">State</label>
              <select [(ngModel)]="selection.stateId" (change)="onStateChange()" [disabled]="!selection.countryId"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800/50">
                <option [value]="0">Select State</option>
                <option *ngFor="let s of filteredStates()" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">District</label>
              <select [(ngModel)]="selection.districtId" (change)="onDistrictChange()" [disabled]="!selection.stateId"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800/50">
                <option [value]="0">Select District</option>
                <option *ngFor="let d of filteredDistricts()" [value]="d.id">{{ d.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Taluka</label>
              <select [(ngModel)]="villageForm.talukaId" [disabled]="!selection.districtId"
                      class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer text-sm disabled:bg-gray-50 dark:disabled:bg-gray-800/50">
                <option [value]="0">Select Taluka</option>
                <option *ngFor="let t of filteredTalukas()" [value]="t.id">{{ t.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Village Name</label>
              <input [(ngModel)]="villageForm.name" type="text" placeholder="Enter village name" 
                     class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm">
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0 border-t border-gray-100 dark:border-gray-700">
          <button (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
          <button (click)="saveVillage()" [disabled]="!villageForm.name || !villageForm.talukaId" 
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
            {{ editingVillage ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class VillageListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  villages = signal<Village[]>([]);
  countries = signal<Country[]>([]);
  states = signal<State[]>([]);
  districts = signal<District[]>([]);
  talukas = signal<Taluka[]>([]);

  isModalOpen = false;
  editingVillage: Village | null = null;
  villageForm = { name: '', talukaId: 0 };
  
  selection = {
    countryId: 0,
    stateId: 0,
    districtId: 0
  };

  filteredStates = computed(() => this.states().filter(s => s.countryId === Number(this.selection.countryId)));
  filteredDistricts = computed(() => this.districts().filter(d => d.stateId === Number(this.selection.stateId)));
  filteredTalukas = computed(() => this.talukas().filter(t => t.districtId === Number(this.selection.districtId)));

  ngOnInit() {
    this.loadVillages();
    this.loadCountries();
    this.loadStates();
    this.loadDistricts();
    this.loadTalukas();
  }

  loadVillages() {
    this.mastersService.getVillages().subscribe({
      next: (data) => this.villages.set(data),
      error: () => this.toast.show('Failed to load villages', 'error')
    });
  }

  loadCountries() { this.mastersService.getCountries().subscribe(d => this.countries.set(d)); }
  loadStates() { this.mastersService.getStates().subscribe(d => this.states.set(d)); }
  loadDistricts() { this.mastersService.getDistricts().subscribe(d => this.districts.set(d)); }
  loadTalukas() { this.mastersService.getTalukas().subscribe(d => this.talukas.set(d)); }

  onCountryChange() { this.selection.stateId = 0; this.selection.districtId = 0; this.villageForm.talukaId = 0; }
  onStateChange() { this.selection.districtId = 0; this.villageForm.talukaId = 0; }
  onDistrictChange() { this.villageForm.talukaId = 0; }

  openModal(village?: Village) {
    if (village) {
      this.editingVillage = village;
      this.villageForm = { name: village.name, talukaId: village.talukaId };
      
      // Auto-set hierarchy for editing
      const taluka = this.talukas().find(t => t.id === village.talukaId);
      if (taluka) {
        this.selection.districtId = taluka.districtId;
        const dist = this.districts().find(d => d.id === taluka.districtId);
        if (dist) {
          this.selection.stateId = dist.stateId;
          const state = this.states().find(s => s.id === dist.stateId);
          if (state) {
            this.selection.countryId = state.countryId;
          }
        }
      }
    } else {
      this.editingVillage = null;
      this.villageForm = { name: '', talukaId: 0 };
      this.selection = { countryId: 0, stateId: 0, districtId: 0 };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingVillage = null;
    this.villageForm = { name: '', talukaId: 0 };
    this.selection = { countryId: 0, stateId: 0, districtId: 0 };
  }

  saveVillage() {
    if (this.editingVillage) {
      this.mastersService.updateVillage({ ...this.editingVillage, name: this.villageForm.name, talukaId: this.villageForm.talukaId })
        .subscribe({
          next: () => {
            this.toast.show('Village updated successfully');
            this.loadVillages();
            this.closeModal();
          },
          error: () => this.toast.show('Failed to update village', 'error')
        });
    } else {
      this.mastersService.createVillage(this.villageForm)
        .subscribe({
          next: () => {
            this.toast.show('Village created successfully');
            this.loadVillages();
            this.closeModal();
          },
          error: () => this.toast.show('Failed to create village', 'error')
        });
    }
  }

  deleteVillage(village: Village) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${village.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteVillage(village.id!).subscribe({
          next: () => {
            this.toast.show('Village deleted successfully');
            this.loadVillages();
          },
          error: (err) => this.toast.show(err.error?.message || 'Failed to delete village', 'error')
        });
      }
    });
  }
}
