import { Component, Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<{ message: string, type: 'success' | 'info' | 'error' | 'warning', id: number }[]>([]);
  private counter = 0;

  show(message: string, type: 'success' | 'info' | 'error' | 'warning' = 'info', duration: number = 3000) {
    const id = this.counter++;
    this.toasts.update(current => [...current, { message, type, id }]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    return id;
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 left-6 flex flex-col gap-2 z-[100]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="getToastClass(toast.type)" 
             class="text-white px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[300px] animate-fade-in-up">
           <div class="flex-1 text-sm">{{ toast.message }}</div>
           <button (click)="toastService.remove(toast.id)" class="hover:opacity-80">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out;
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) { }

  getToastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      default: return 'bg-gray-800';
    }
  }
}

