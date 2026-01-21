import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="close()"></div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all">
         <div class="p-6">
           <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{{ title }}</h3>
           
           <input type="text" [(ngModel)]="inputValue" (keyup.enter)="confirm()" [placeholder]="placeholder"
                  class="w-full px-3 py-2 border border-blue-500 rounded-md outline-none focus:ring-2 focus:ring-blue-500/20 mb-6 dark:bg-gray-700 dark:text-white dark:border-blue-500" autofocus>
           
           <div class="flex justify-end gap-3">
             <button (click)="close()" class="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition dark:text-blue-400 dark:hover:bg-gray-700">Cancel</button>
             <button (click)="confirm()" [disabled]="!inputValue.trim()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed">
                {{ actionButtonText }}
             </button>
           </div>
         </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() placeholder = '';
  @Input() actionButtonText = 'Create';
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<string>();

  inputValue = '';

  close() {
    this.isOpen = false;
    this.inputValue = '';
    this.onClose.emit();
  }

  confirm() {
    if (this.inputValue.trim()) {
      this.onConfirm.emit(this.inputValue);
      this.close();
    }
  }

  open() {
    this.isOpen = true;
    this.inputValue = ''; // Reset on open
  }

  openWithValue(value: string) {
    this.isOpen = true;
    this.inputValue = value;
  }
}
