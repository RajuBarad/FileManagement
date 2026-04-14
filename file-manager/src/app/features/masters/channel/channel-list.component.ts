import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Channel } from '../../../core/models/channel.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Channel Master</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Manage channels and notification reminder settings</p>
        </div>
        <button (click)="openModal()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm">
          <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
          Add Channel
        </button>
      </div>

      <!-- Table Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">#</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Channel Name</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Reminder Days</th>
                <th class="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let channel of channels(); let i = index" class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition">
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{{ i + 1 }}</td>
                <td class="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{{ channel.name }}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                     {{ channel.reminderDays }} days
                  </span>
                </td>
                <td class="px-6 py-4 text-right space-x-2">
                  <button (click)="openModal(channel)" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                    <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                  </button>
                  <button (click)="deleteChannel(channel)" class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
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
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ editingChannel() ? 'Edit Channel' : 'Add Channel' }}</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
             <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>
        
        <div class="p-6 bg-white dark:bg-gray-800">
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Channel Name</label>
            <input [(ngModel)]="channelForm.name" type="text" placeholder="Enter channel name"
                   class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm">
          </div>
          <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reminder Days</label>
            <input [(ngModel)]="channelForm.reminderDays" type="number" placeholder="Enter days"
                   class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm">
          </div>
          
          <div class="flex justify-end gap-3 mt-2">
            <button (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition font-medium">Cancel</button>
            <button (click)="saveChannel()" [disabled]="!channelForm.name" 
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium shadow-sm">
              {{ editingChannel() ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChannelListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);

  channels = signal<Channel[]>([]);
  isModalOpen = signal<boolean>(false);
  editingChannel = signal<Channel | null>(null);
  channelForm = { name: '', reminderDays: 0 };

  ngOnInit() {
    this.loadChannels();
  }

  loadChannels() {
    this.mastersService.getChannels().subscribe({
      next: (data) => this.channels.set(data),
      error: () => this.toast.show('Failed to load channels', 'error')
    });
  }

  openModal(channel?: Channel) {
    if (channel) {
      this.editingChannel.set(channel);
      this.channelForm = { name: channel.name, reminderDays: channel.reminderDays };
    } else {
      this.editingChannel.set(null);
      this.channelForm = { name: '', reminderDays: 0 };
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingChannel.set(null);
  }

  saveChannel() {
    if (this.editingChannel()) {
      this.mastersService.updateChannel({ ...this.editingChannel()!, ...this.channelForm }).subscribe({
        next: () => {
          this.toast.show('Channel updated successfully');
          this.loadChannels();
          this.closeModal();
        },
        error: () => this.toast.show('Failed to update channel', 'error')
      });
    } else {
      this.mastersService.createChannel(this.channelForm).subscribe({
        next: () => {
          this.toast.show('Channel created successfully');
          this.loadChannels();
          this.closeModal();
        },
        error: () => this.toast.show('Failed to create channel', 'error')
      });
    }
  }

  deleteChannel(channel: Channel) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete channel ${channel.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mastersService.deleteChannel(channel.id!).subscribe({
          next: () => {
            this.toast.show('Channel deleted successfully');
            this.loadChannels();
          },
          error: (err) => this.toast.show(err.error?.message || 'Failed to delete channel', 'error')
        });
      }
    });
  }
}
