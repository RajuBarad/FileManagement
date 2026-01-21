import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconsModule } from '../../core/modules/icons.module';
import { RouterLink } from '@angular/router';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
            <p class="text-gray-500 dark:text-gray-400">Manage users and system settings</p>
          </div>
          <div class="flex items-center gap-4">
             <button (click)="openAddModal()" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
                Add User
             </button>
             <a routerLink="/files" class="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700">
                <lucide-icon name="arrow-left" class="h-4 w-4"></lucide-icon>
                Back to Files
             </a>
          </div>
        </div>

        <!-- Users List -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Registered Users</h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">
                <tr>
                  <th class="px-6 py-3">Name</th>
                  <th class="px-6 py-3">Email</th>
                  <th class="px-6 py-3">Role</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngFor="let user of users()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td class="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{{ user.name }}</td>
                  <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ user.email }}</td>
                  <td class="px-6 py-4">
                    <span [class]="user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'"
                          class="px-2 py-1 rounded-full text-xs font-medium">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right flex justify-end gap-2">
                     <button (click)="editUser(user)" class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Edit">
                        <lucide-icon name="edit-2" class="h-4 w-4"></lucide-icon>
                     </button>
                     <button (click)="deleteUser(user)" class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete">
                        <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                     </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- User Modal -->
      <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="closeModal()"></div>
        
        <!-- Modal Content -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                    {{ editingMode() ? 'Edit User' : 'Add New User' }}
                </h3>
                <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                    <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
                </button>
            </div>
            
            <div class="p-6">
                <form (ngSubmit)="saveUser()" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input type="text" [(ngModel)]="newUser.name" name="name" required placeholder="Enter full name"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email / Username</label>
                        <input type="text" [(ngModel)]="newUser.email" name="email" required placeholder="Enter username"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for login</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {{ editingMode() ? 'New Password (Optional)' : 'Password' }}
                        </label>
                        <input type="password" [(ngModel)]="newUser.password" name="password" 
                               [required]="!editingMode()" placeholder="••••••••"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select [(ngModel)]="newUser.role" name="role" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <button type="button" (click)="closeModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition font-medium">
                            Cancel
                        </button>
                        <button type="submit" [disabled]="loading()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium disabled:opacity-50 flex items-center gap-2">
                             <lucide-icon *ngIf="loading()" name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
                             {{ editingMode() ? 'Update' : 'Create' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  auth = inject(AuthService);
  toast = inject(ToastService);

  users = signal<User[]>([]);
  loading = signal(false);

  newUser: Partial<User> = {
    role: 'user',
    name: '',
    email: '',
    password: ''
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.auth.getUsers().subscribe(users => {
      this.users.set(users);
    });
  }

  // State for editing
  showModal = signal(false);
  editingMode = signal(false);
  editingId = signal<string | null>(null);

  openAddModal() {
    this.cancelEdit();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.cancelEdit();
  }

  // Populate form for editing
  editUser(user: User) {
    this.newUser = {
      name: user.name,
      email: user.email,
      role: user.role,
      password: '' // Keep empty, only send if changing
    };
    this.editingMode.set(true);
    this.editingId.set(user.id);
    this.showModal.set(true);
  }

  cancelEdit() {
    this.newUser = { role: 'user', name: '', email: '', password: '' };
    this.editingMode.set(false);
    this.editingId.set(null);
  }

  saveUser() { // Renamed from createUser
    if (!this.newUser.name || !this.newUser.email) {
      this.toast.show('Name and Email are required', 'error');
      return;
    }

    if (!this.editingMode() && !this.newUser.password) {
      this.toast.show('Password is required for new users', 'error');
      return;
    }

    this.loading.set(true);

    if (this.editingMode() && this.editingId()) {
      // Update
      const updatePayload = {
        id: this.editingId()!,
        name: this.newUser.name,
        role: this.newUser.role,
        password: this.newUser.password // Optional
      };

      this.auth.updateUser(updatePayload).subscribe({
        next: () => {
          this.toast.show('User updated successfully', 'success');
          this.resetForm();
        },
        error: (err) => {
          this.toast.show(err.message, 'error');
          this.loading.set(false);
        }
      });
    } else {
      // Create
      const start = { ...this.newUser, id: crypto.randomUUID() } as User;
      this.auth.register(start).subscribe({
        next: () => {
          this.toast.show('User created successfully', 'success');
          this.resetForm();
        },
        error: (err) => {
          this.toast.show(err.message, 'error');
          this.loading.set(false);
        }
      });
    }
  }

  deleteUser(user: User) {
    if (!confirm('Are you sure you want to delete ' + user.name + '?')) return;

    this.loading.set(true);
    this.auth.deleteUser(user.id).subscribe({
      next: () => {
        this.toast.show('User deleted successfully', 'success');
        this.loadUsers();
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.show(err.message, 'error');
        this.loading.set(false);
      }
    });
  }

  private resetForm() {
    this.loading.set(false);
    this.loadUsers();
    this.newUser = { role: 'user', name: '', email: '', password: '' };
    this.editingMode.set(false);
    this.editingId.set(null);
  }
}
