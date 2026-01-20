import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      
      <!-- Decorative blobs -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div class="absolute top-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div class="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div class="p-8">
          <div class="flex flex-col items-center mb-10">
            <div class="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white mb-4 shadow-inner border border-white/30">
              <lucide-icon name="cloud" class="h-8 w-8"></lucide-icon>
            </div>
            <h2 class="text-3xl font-bold text-white tracking-tight">BVA Drive Login</h2>
            <p class="text-blue-100 mt-2 font-light">Secure Access to Your Cloud</p>
          </div>


          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-blue-50 ml-1">Username</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-200">
                  <lucide-icon name="user" class="h-5 w-5"></lucide-icon>
                </div>
                <input type="text" [(ngModel)]="email" name="username" required
                      class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl content-center text-white placeholder-blue-200/50 focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition backdrop-blur-sm"
                      placeholder="Enter your username">
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-blue-50 ml-1">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-200">
                  <lucide-icon name="lock" class="h-5 w-5"></lucide-icon>
                </div>
                <input type="password" [(ngModel)]="password" name="password" required
                      class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl content-center text-white placeholder-blue-200/50 focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition backdrop-blur-sm"
                      placeholder="••••••••">
              </div>
            </div>

            <button type="submit" [disabled]="isLoading()" 
                    class="w-full bg-white text-purple-600 py-3.5 rounded-xl font-bold text-lg hover:bg-blue-50 focus:ring-4 focus:ring-blue-300 transition shadow-lg disabled:opacity-70 flex items-center justify-center mt-8">
              <span *ngIf="!isLoading()" class="flex items-center gap-2">
                Sign In <lucide-icon name="arrow-right" class="h-5 w-5"></lucide-icon>
              </span>
              <span *ngIf="isLoading()" class="flex items-center gap-2">
                <div class="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                Signing in...
              </span>
            </button>
            
            <div class="text-center mt-6">
              <p class="text-xs text-blue-200/60 font-light">
                Provide credentials to access your workspace
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Override Browser Autofill to match the Glassmorphism theme */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active{
        -webkit-background-clip: text;
        -webkit-text-fill-color: #ffffff;
        transition: background-color 5000s ease-in-out 0s;
        box-shadow: inset 0 0 20px 20px #ffffff1a;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);


  onSubmit() {
    console.log('Login onSubmit triggered', this.email, this.password);

    if (!this.email || !this.password) {
      this.toast.show('Please enter both username and password', 'error');
      return;
    }
    this.isLoading.set(true);
    console.log('Calling authService.login');
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.show(err.message || 'Invalid username or password', 'error');
      }
    });
  }
}
