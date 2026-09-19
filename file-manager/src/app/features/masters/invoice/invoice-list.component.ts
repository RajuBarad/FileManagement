import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../../core/services/masters.service';
import { Invoice, InvoiceItem } from '../../../core/models/invoice.model';
import { Client } from '../../../core/models/client.model';
import { ToastService } from '../../../core/services/toast.service';
import { PermissionService } from '../../../core/services/permission.service';
import { IconsModule } from '../../../core/modules/icons.module';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';
import { BVA_LOGO_BASE64 } from './bva-logo.constant';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconsModule],
  template: `
    <div class="p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800">
              <lucide-icon name="receipt" class="h-6 w-6"></lucide-icon>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Invoice / Bill Master</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">Professional legal billing, multiple fee & expense items, and direct PDF generation</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button *ngIf="permissionService.canAdd('master_invoice')" 
                  (click)="openModal()" 
                  class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/20">
            <lucide-icon name="plus" class="h-4 w-4"></lucide-icon>
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      <!-- Stats Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Invoices</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ totalInvoicesCount() }}</p>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <lucide-icon name="file-text" class="h-5 w-5"></lucide-icon>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total Billed</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{{ totalBilledAmount() | number:'1.0-2' }}</p>
          </div>
          <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <lucide-icon name="receipt" class="h-5 w-5"></lucide-icon>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">Total Paid</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">₹{{ totalPaidAmount() | number:'1.0-2' }}</p>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
            <lucide-icon name="check-circle" class="h-5 w-5"></lucide-icon>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Amount</p>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{{ totalPendingAmount() | number:'1.0-2' }}</p>
          </div>
          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <lucide-icon name="clock" class="h-5 w-5"></lucide-icon>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="relative flex-1 max-w-md">
          <lucide-icon name="search" class="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></lucide-icon>
          <input type="text" 
                 [(ngModel)]="searchQuery" 
                 placeholder="Search by invoice #, client, or items..."
                 class="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-gray-900 dark:text-white placeholder-gray-400">
        </div>

        <div class="flex items-center gap-3">
          <select [(ngModel)]="selectedStatus" 
                  class="text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th class="px-6 py-4">#</th>
                <th class="px-6 py-4">Invoice No</th>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4">Client</th>
                <th class="px-6 py-4">Fee Items / Particulars</th>
                <th class="px-6 py-4 text-right">Amount (₹)</th>
                <th class="px-6 py-4 text-center">Status</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              <tr *ngFor="let item of filteredInvoices(); let i = index" class="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition">
                <td class="px-6 py-4 text-gray-400 font-mono text-xs">{{ i + 1 }}</td>
                <td class="px-6 py-4 font-semibold text-blue-600 dark:text-blue-400">
                  <button (click)="viewInvoice(item)" class="hover:underline flex items-center gap-1.5 font-mono">
                    <lucide-icon name="receipt" class="h-3.5 w-3.5"></lucide-icon>
                    {{ item.invoiceNo }}
                  </button>
                </td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {{ item.invoiceDate | date:'dd.MM.yyyy' }}
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900 dark:text-white">{{ item.clientName }}</div>
                  <div *ngIf="item.clientAddress" class="text-xs text-gray-400 truncate max-w-xs">{{ item.clientAddress }}</div>
                </td>
                <td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                  <div *ngIf="item.feeItems && item.feeItems.length > 0" class="space-y-0.5">
                    <div *ngFor="let f of item.feeItems.slice(0, 2)" class="text-xs">
                      <span class="font-medium text-gray-800 dark:text-gray-200">{{ f.name }}</span>
                      <span *ngIf="f.subText" class="text-gray-400 ml-1">({{ f.subText }})</span>
                    </div>
                    <span *ngIf="item.feeItems.length > 2" class="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      +{{ item.feeItems.length - 2 }} more
                    </span>
                  </div>
                  <div *ngIf="!item.feeItems || item.feeItems.length === 0">
                    <span class="font-medium">{{ item.matter || 'Professional Services' }}</span>
                    <span *ngIf="item.paymentType" class="text-xs text-gray-400 ml-1">({{ item.paymentType }})</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  ₹{{ item.totalAmount | number:'1.2-2' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span [ngClass]="{
                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800': item.status === 'Pending',
                    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800': item.status === 'Paid',
                    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800': item.status === 'Partially Paid',
                    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700': item.status === 'Cancelled'
                  }" class="px-2.5 py-1 rounded-full text-xs font-medium border inline-block">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <div class="flex items-center justify-end gap-1">
                    <!-- Direct Make PDF from Row -->
                    <button (click)="directDownloadRowPdf(item)" 
                            [disabled]="isGeneratingPdf"
                            title="Direct Make PDF"
                            class="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition">
                      <lucide-icon name="download" class="h-4 w-4"></lucide-icon>
                    </button>
                    <!-- Preview & Print -->
                    <button (click)="viewInvoice(item)" 
                            title="Preview / Print Bill"
                            class="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition">
                      <lucide-icon name="printer" class="h-4 w-4"></lucide-icon>
                    </button>
                    <!-- Edit -->
                    <button *ngIf="permissionService.canUpdate('master_invoice')"
                            (click)="openModal(item)" 
                            title="Edit Invoice"
                            class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                      <lucide-icon name="edit" class="h-4 w-4"></lucide-icon>
                    </button>
                    <!-- Delete -->
                    <button *ngIf="permissionService.canDelete('master_invoice')"
                            (click)="deleteInvoice(item)" 
                            title="Delete Invoice"
                            class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                      <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredInvoices().length === 0">
                <td colspan="8" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center gap-3">
                    <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400">
                      <lucide-icon name="receipt" class="h-8 w-8"></lucide-icon>
                    </div>
                    <p class="font-medium text-gray-700 dark:text-gray-300">No invoices found</p>
                    <p class="text-xs text-gray-400 max-w-sm">Get started by creating your first bill or professional services invoice.</p>
                    <button *ngIf="permissionService.canAdd('master_invoice')" 
                            (click)="openModal()" 
                            class="mt-2 text-xs bg-blue-600 text-white px-3.5 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                      Create First Invoice
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create / Edit Invoice Modal -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30 shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <lucide-icon [name]="editingInvoice ? 'edit' : 'plus'" class="h-5 w-5"></lucide-icon>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ editingInvoice ? 'Edit Invoice' : 'Create New Invoice' }}
              </h2>
              <p class="text-xs text-gray-400">Professional services bill with multiple fee and expense items</p>
            </div>
          </div>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
          </button>
        </div>

        <!-- Modal Body Form -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          
          <!-- Invoice Meta Info -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">Invoice No *</label>
              <div class="flex gap-2">
                <input type="text" [(ngModel)]="formData.invoiceNo" placeholder="e.g. R/LEGAL/044" 
                       class="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 dark:text-white">
                <button type="button" (click)="fetchNextNumber()" title="Auto-generate next number" 
                        class="px-2.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium transition">
                  Auto
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">Invoice Date *</label>
              <input type="date" [(ngModel)]="formData.invoiceDate" 
                     class="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">Status</label>
              <select [(ngModel)]="formData.status" 
                      class="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <!-- Client Details -->
          <div class="bg-gray-50/70 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200/70 dark:border-gray-700/70 space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Client Information (Bill To)</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Select Existing Client (Optional)</label>
                <select [(ngModel)]="formData.clientId" (change)="onClientSelected()"
                        class="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
                  <option [ngValue]="null">-- Or enter custom client details below --</option>
                  <option *ngFor="let c of clientsList()" [ngValue]="c.id">{{ c.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Client Name / Firm *</label>
                <input type="text" [(ngModel)]="formData.clientName" placeholder="e.g. VAIBHAV PETROLEUM (BPCL)"
                       class="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Client Address / Location</label>
              <input type="text" [(ngModel)]="formData.clientAddress" placeholder="e.g. At. - Chansma Dist.-Patan"
                     class="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Client PAN No.</label>
                <input type="text" [(ngModel)]="formData.panNo" placeholder="e.g. AAHFB3723C"
                       class="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase text-gray-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">GSTIN Note</label>
                <input type="text" [(ngModel)]="formData.gstin" placeholder="Under RCM applicable to Recipient"
                       class="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white">
              </div>
            </div>
          </div>

          <!-- SECTION 1: PROFESSIONAL FEES (MULTIPLE ITEMS) -->
          <div class="bg-blue-50/40 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <span>1. Professional Fees</span>
                  <span class="text-xs text-blue-600 dark:text-blue-400 font-normal">({{ feeItemsList.length }} items)</span>
                </h3>
                <p class="text-[11px] text-gray-500 dark:text-gray-400">e.g. RECON, PART PAYMENT, Legal Opinion, etc.</p>
              </div>
              <button type="button" (click)="addFeeItem()" 
                      class="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition">
                <lucide-icon name="plus" class="h-3.5 w-3.5"></lucide-icon>
                <span>Add Fee Item</span>
              </button>
            </div>

            <!-- Fee Items List -->
            <div class="space-y-2">
              <div *ngFor="let item of feeItemsList; let idx = index" 
                   class="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-2 shadow-xs">
                
                <div class="flex-1 w-full md:w-auto">
                  <input type="text" [(ngModel)]="item.name" (ngModelChange)="calculateTotal()"
                         placeholder="Item Name / Particulars (e.g. RECON, Title Search)"
                         class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                </div>

                <div class="w-full md:w-48">
                  <input type="text" [(ngModel)]="item.subText" (ngModelChange)="calculateTotal()"
                         placeholder="Stage / Note (e.g. PART PAYMENT)"
                         class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                </div>

                <div class="w-full md:w-36">
                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                    <input type="number" min="0" step="0.01" [(ngModel)]="item.amount" (ngModelChange)="calculateTotal()"
                           placeholder="0.00"
                           class="w-full pl-6 pr-3 py-1.5 text-xs font-bold text-right bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                  </div>
                </div>

                <button type="button" (click)="removeFeeItem(idx)" 
                        [disabled]="feeItemsList.length <= 1"
                        class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-30">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </div>
            </div>

            <!-- Fee Subtotal -->
            <div class="flex justify-between items-center text-xs pt-1 px-1 font-semibold text-blue-900 dark:text-blue-300">
              <span>Total Professional Fees:</span>
              <span class="font-bold text-sm">₹{{ totalFeeAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- SECTION 2: OUT OF POCKET EXPENSES (MULTIPLE ITEMS) -->
          <div class="bg-amber-50/40 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>2. Out of Pocket Expenses</span>
                  <span class="text-xs text-amber-600 dark:text-amber-400 font-normal">({{ expenseItemsList.length }} items)</span>
                </h3>
                <p class="text-[11px] text-gray-500 dark:text-gray-400">e.g. Travelling, Court Stamp, Clerical/Typing, Xerox, etc.</p>
              </div>
              <button type="button" (click)="addExpenseItem()" 
                      class="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition">
                <lucide-icon name="plus" class="h-3.5 w-3.5"></lucide-icon>
                <span>Add Expense Item</span>
              </button>
            </div>

            <!-- Expense Items List -->
            <div class="space-y-2">
              <div *ngFor="let item of expenseItemsList; let idx = index" 
                   class="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-2 shadow-xs">
                
                <div class="flex-1 w-full md:w-auto">
                  <input type="text" [(ngModel)]="item.name" (ngModelChange)="calculateTotal()"
                         placeholder="Expense Name (e.g. Travelling Expenses, Court Fee)"
                         class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500">
                </div>

                <div class="w-full md:w-48">
                  <input type="text" [(ngModel)]="item.subText" (ngModelChange)="calculateTotal()"
                         placeholder="Details / Note (e.g. Chansma - Patan visit)"
                         class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500">
                </div>

                <div class="w-full md:w-36">
                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                    <input type="number" min="0" step="0.01" [(ngModel)]="item.amount" (ngModelChange)="calculateTotal()"
                           placeholder="0.00"
                           class="w-full pl-6 pr-3 py-1.5 text-xs font-bold text-right bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500">
                  </div>
                </div>

                <button type="button" (click)="removeExpenseItem(idx)" 
                        class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                  <lucide-icon name="trash-2" class="h-4 w-4"></lucide-icon>
                </button>
              </div>

              <div *ngIf="expenseItemsList.length === 0" class="text-xs text-gray-400 italic py-1 px-1">
                No out-of-pocket expenses added. Click "Add Expense Item" if there are any reimbursed costs.
              </div>
            </div>

            <!-- Expense Subtotal -->
            <div *ngIf="expenseItemsList.length > 0" class="flex justify-between items-center text-xs pt-1 px-1 font-semibold text-amber-900 dark:text-amber-300">
              <span>Total Out of Pocket Expenses:</span>
              <span class="font-bold text-sm">₹{{ totalExpenseAmount | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Computed Grand Total & Words -->
          <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-blue-200">TOTAL BILL AMOUNT:</span>
              <p class="text-sm font-medium italic mt-0.5 text-blue-100">{{ formData.amountInWords }}</p>
            </div>
            <div class="text-3xl font-black tracking-tight">
              ₹{{ (formData.totalAmount || 0) | number:'1.2-2' }}
            </div>
          </div>

          <!-- Bank Details Accordion/Section -->
          <div class="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Firm Bank Details</span>
              <button type="button" (click)="resetDefaultBankDetails()" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Reset to Default BVA Bank
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Bank & Branch</label>
                <input type="text" [(ngModel)]="formData.bankName" 
                       class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Account Holder</label>
                <input type="text" [(ngModel)]="formData.accountName" 
                       class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Current A/c No.</label>
                <input type="text" [(ngModel)]="formData.accountNo" 
                       class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">IFSC Code</label>
                <input type="text" [(ngModel)]="formData.ifscCode" 
                       class="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-mono uppercase text-gray-900 dark:text-white">
              </div>
            </div>
          </div>

        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-4 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
          <button type="button" (click)="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-xl transition">
            Cancel
          </button>
          <button type="button" (click)="saveInvoice()" [disabled]="isSubmitting" 
                  class="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50">
            <lucide-icon *ngIf="isSubmitting" name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
            <span>{{ editingInvoice ? 'Save Changes' : 'Create Invoice' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Printable Bill Preview Modal -->
    <div *ngIf="isPreviewOpen && activePreviewInvoice" 
         class="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden my-auto">
        
        <!-- Preview Actions Bar (Hidden in Print) -->
        <div class="print:hidden px-6 py-3.5 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-gray-800 dark:text-white font-mono">{{ activePreviewInvoice.invoiceNo }}</span>
            <span class="text-xs text-gray-400">• Bill for Professional Services</span>
          </div>
          <div class="flex items-center gap-2">
            <!-- Direct Make PDF Button -->
            <button (click)="downloadDirectPdf()" 
                    [disabled]="isGeneratingPdf"
                    class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50">
              <lucide-icon *ngIf="!isGeneratingPdf" name="download" class="h-4 w-4"></lucide-icon>
              <lucide-icon *ngIf="isGeneratingPdf" name="loader-2" class="h-4 w-4 animate-spin"></lucide-icon>
              <span>{{ isGeneratingPdf ? 'Generating PDF...' : 'Direct Make PDF' }}</span>
            </button>
            <!-- Print / System PDF Button -->
            <button (click)="printInvoice()" 
                    class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition">
              <lucide-icon name="printer" class="h-4 w-4"></lucide-icon>
              <span>Print</span>
            </button>
            <button (click)="closePreview()" 
                    class="p-2 text-gray-500 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-xl transition">
              <lucide-icon name="x" class="h-4 w-4"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Scrollable Document Area -->
        <div class="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-200/70 dark:bg-gray-950 flex justify-center">
          
          <!-- Exact Physical Invoice Container (A4 Proportions - No Page Full Border) -->
          <div id="printable-bill-canvas" #printableCanvas
               class="bg-white text-black p-8 sm:p-10 w-full max-w-[760px] min-h-[1050px] print:p-0 print:m-0 flex flex-col justify-between font-sans text-[12px] leading-normal">
            
            <div>
              <!-- TOP RIGHT OFFICIAL BVA LOGO -->
              <div class="flex justify-end mb-5">
                <img [src]="bvaLogo" alt="Bharat Vasoya & Associates" class="h-20 w-auto object-contain" />
              </div>

              <!-- CLIENT & INVOICE DETAILS GRID -->
              <table class="w-full border-collapse border border-black mb-5 font-sans text-xs bg-white">
                <tbody>
                  <tr>
                    <!-- Left: Bill To Box (Simple Clean White) -->
                    <td class="w-[58%] p-3 border-r border-black align-top bg-white">
                      <div class="text-[11px] font-bold text-black mb-1.5">To</div>
                      <div class="space-y-1">
                        <div class="font-bold text-black text-sm leading-snug">
                          {{ activePreviewInvoice.clientName }}
                        </div>
                        <div *ngIf="activePreviewInvoice.clientAddress" class="text-xs font-semibold text-black whitespace-pre-line leading-relaxed">
                          <div *ngFor="let line of getAddressLines(activePreviewInvoice.clientAddress)">
                            {{ line }}
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Right: Invoice Metadata Box (Simple Clean White) -->
                    <td class="w-[42%] p-0 align-top bg-white">
                      <table class="w-full border-collapse text-xs bg-white">
                        <tbody>
                          <tr class="border-b border-black">
                            <td class="w-[42%] font-bold p-1.5 border-r border-black text-black bg-white">Invoice No.</td>
                            <td class="w-[58%] p-1.5 font-bold font-mono text-black bg-white">{{ activePreviewInvoice.invoiceNo }}</td>
                          </tr>
                          <tr class="border-b border-black">
                            <td class="w-[42%] font-bold p-1.5 border-r border-black text-black bg-white">Date</td>
                            <td class="w-[58%] p-1.5 font-bold text-black bg-white">{{ activePreviewInvoice.invoiceDate | date:'dd.MM.yyyy' }}</td>
                          </tr>
                          <tr class="border-b border-black">
                            <td class="w-[42%] font-bold p-1.5 border-r border-black text-black bg-white">PAN NO,</td>
                            <td class="w-[58%] p-1.5 font-mono text-black font-semibold bg-white">{{ activePreviewInvoice.panNo || 'AAHFB3723C' }}</td>
                          </tr>
                          <tr>
                            <td class="w-[42%] font-bold p-1.5 border-r border-black text-black bg-white">GSTIN</td>
                            <td class="w-[58%] p-1.5 text-[10.5px] leading-tight text-black bg-white">{{ activePreviewInvoice.gstin || 'Under RCM applicable to Recipient' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Bill Title (Uniform Font) -->
              <div class="text-center font-bold text-sm tracking-wide mb-4 text-black">
                {{ activePreviewInvoice.particularsTitle || 'Bill for Professional Services' }}
              </div>

              <!-- PARTICULARS TABLE (Simple Clean White, Uniform Font) -->
              <table class="w-full border-collapse border border-black mb-5 font-sans text-xs bg-white">
                <thead>
                  <tr class="border-b border-black bg-white">
                    <th class="p-2.5 text-left border-r border-black font-bold text-black w-[75%] bg-white">Particulars</th>
                    <th class="p-2.5 text-right font-bold text-black w-[25%] bg-white pr-4">Amt. Rs.</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Professional Fees Header -->
                  <tr class="bg-white">
                    <td class="p-2.5 border-r border-black align-top font-bold text-black uppercase bg-white">
                      PROFESSIONAL FEES
                    </td>
                    <td class="p-2.5 align-top bg-white"></td>
                  </tr>

                  <!-- Fee Items (Multi-items with notes formatted like Out of Pocket Expenses) -->
                  <ng-container *ngIf="activePreviewInvoice.feeItems && activePreviewInvoice.feeItems.length > 0">
                    <tr *ngFor="let f of activePreviewInvoice.feeItems" class="bg-white">
                      <td class="px-2.5 py-1 border-r border-black align-top bg-white">
                        <span class="font-bold text-black uppercase">{{ f.name }}</span>
                        <span *ngIf="f.subText" class="text-gray-700 italic ml-1 font-normal">({{ f.subText }})</span>
                      </td>
                      <td class="px-2.5 py-1 align-top font-bold text-black text-sm bg-white text-right pr-4">
                        {{ f.amount | number:'1.0-2' }}/-
                      </td>
                    </tr>
                  </ng-container>

                  <!-- Fallback single fee item if feeItems empty -->
                  <tr *ngIf="!activePreviewInvoice.feeItems || activePreviewInvoice.feeItems.length === 0" class="bg-white">
                    <td class="px-2.5 py-1 border-r border-black align-top bg-white">
                      <span *ngIf="activePreviewInvoice.matter" class="font-bold text-black uppercase">{{ activePreviewInvoice.matter }}</span>
                      <span *ngIf="activePreviewInvoice.paymentType" class="text-gray-700 italic ml-1 font-normal">({{ activePreviewInvoice.paymentType }})</span>
                    </td>
                    <td class="px-2.5 py-1 align-top font-bold text-black text-sm bg-white text-right pr-4">
                      {{ activePreviewInvoice.professionalFees | number:'1.0-2' }}/-
                    </td>
                  </tr>

                  <!-- Spacer row to maintain official form height -->
                  <tr class="h-24 bg-white">
                    <td class="border-r border-black bg-white"></td>
                    <td class="bg-white"></td>
                  </tr>

                  <!-- Out of Pocket Expenses Header (No horizontal divider line - matching Image 2) -->
                  <tr class="bg-white">
                    <td class="p-2.5 pt-2 border-r border-black font-bold text-black uppercase bg-white">
                      OUT OF POCKET EXPENSES:
                    </td>
                    <td class="p-2.5 pt-2 bg-white"></td>
                  </tr>

                  <!-- Expense Items (Multi-items) -->
                  <ng-container *ngIf="activePreviewInvoice.expenseItems && activePreviewInvoice.expenseItems.length > 0">
                    <tr *ngFor="let e of activePreviewInvoice.expenseItems" class="bg-white">
                      <td class="px-2.5 py-1 border-r border-black bg-white">
                        <span class="font-bold text-black uppercase">{{ e.name }}</span>
                        <span *ngIf="e.subText" class="text-gray-700 italic ml-1 font-normal">({{ e.subText }})</span>
                      </td>
                      <td class="px-2.5 py-1 font-bold text-black text-sm bg-white text-right pr-4">
                        {{ e.amount | number:'1.0-2' }}/-
                      </td>
                    </tr>
                  </ng-container>

                  <!-- Fallback single expense if expenseItems empty -->
                  <tr *ngIf="(!activePreviewInvoice.expenseItems || activePreviewInvoice.expenseItems.length === 0) && (activePreviewInvoice.outOfPocketExpenses || 0) > 0" class="bg-white">
                    <td class="px-2.5 py-1 border-r border-black font-semibold text-black bg-white">
                      <span *ngIf="activePreviewInvoice.expensesNote" class="italic text-gray-700 font-normal">
                        {{ activePreviewInvoice.expensesNote }}
                      </span>
                    </td>
                    <td class="px-2.5 py-1 font-bold text-black text-sm bg-white text-right pr-4">
                      {{ activePreviewInvoice.outOfPocketExpenses | number:'1.0-2' }}/-
                    </td>
                  </tr>

                  <!-- Total Row (Font Increased & Right Aligned, Clean White) -->
                  <tr class="border-t border-black font-bold text-xs bg-white">
                    <td class="p-2.5 border-r border-black uppercase text-black font-bold bg-white">
                      {{ activePreviewInvoice.amountInWords || 'TOTAL' }}
                    </td>
                    <td class="p-2.5 font-extrabold text-black text-base bg-white text-right pr-4">
                      <span>
                        {{ activePreviewInvoice.totalAmount | number:'1.0-2' }}/-
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- BANK DETAILS & SIGNATURE BOX (Exact two column box as in PDF) -->
              <table class="w-full border-collapse border border-black mb-8 font-sans text-xs bg-white">
                <tbody>
                  <tr>
                    <!-- Left: Bank Details -->
                    <td class="w-[60%] p-3 border-r border-black align-top leading-relaxed text-black bg-white">
                      <div class="font-bold mb-1 text-black">Bank Details:</div>
                      <div class="text-black">{{ activePreviewInvoice.accountName || 'Bharat Vasoya & Associates' }}</div>
                      <div class="text-black">{{ activePreviewInvoice.bankName || 'Bank of India, Bedipara Br., Rajkot' }}</div>
                      <div class="text-black">Current A/c No. {{ activePreviewInvoice.accountNo || '310820110000514' }}</div>
                      <div class="text-black">IFSC: {{ activePreviewInvoice.ifscCode || 'BKID0003108' }}</div>
                      <div class="mt-3 font-bold text-black">PAN: {{ activePreviewInvoice.firmPan || 'AAHFB3723C' }}</div>
                      <div class="mt-2 font-bold text-black">Jurisdiction : {{ activePreviewInvoice.jurisdiction || 'Rajkot City' }}</div>
                    </td>

                    <!-- Right: Authorized Signatory Box (Exact match to Image 2) -->
                    <td class="w-[42%] p-3.5 align-top flex flex-col justify-between text-black min-h-[150px] bg-white">
                      <div class="font-bold text-[13px] leading-snug text-black">
                        <div class="whitespace-nowrap">For, Bharat Vasoya &</div>
                        <div>Associates,</div>
                      </div>
                      <div class="font-bold mt-20 text-left text-black text-xs">
                        Authorized Signatory
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- FOOTER BAR AT BOTTOM OF PAGE (Exact match to Image 3) -->
            <div class="pt-3 border-t-[1.5px] border-[#142d4c] font-sans text-[10px] text-center leading-relaxed bg-white">
              <div class="text-[#142d4c]">
                <span class="font-bold">RAJKOT:</span> B-703, 'Pramukh Swami Arcade' Malaviya Chowk, Rajkot – 360001.
              </div>
              <div class="text-[#142d4c]">
                <span class="font-bold">AHMEDABAD:</span> 610, ‘Satyam 64’, Opp. Gujarat High Court, S.G. Highway, Ahmedabad-380061.
              </div>
              <div class="text-[#142d4c]">
                <span class="font-bold">Ph.:</span> 0281-2226263 &nbsp;&nbsp; www.bharatvasoya.com &nbsp;&nbsp; <span class="font-bold">email:</span> advocatebharatvasoya&#64;gmail.com
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    #printable-bill-canvas, #printable-bill-canvas * {
      font-family: Arial, Helvetica, 'Segoe UI', sans-serif !important;
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        background: white !important;
      }
      body * {
        visibility: hidden !important;
      }
      #printable-bill-canvas, #printable-bill-canvas * {
        visibility: visible !important;
        font-family: Arial, Helvetica, 'Segoe UI', sans-serif !important;
      }
      #printable-bill-canvas {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  `]
})
export class InvoiceListComponent implements OnInit {
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);
  public permissionService = inject(PermissionService);

  @ViewChild('printableCanvas') printableCanvas!: ElementRef;

  invoices = signal<Invoice[]>([]);
  clientsList = signal<Client[]>([]);
  searchQuery = '';
  selectedStatus = 'ALL';

  isModalOpen = false;
  editingInvoice: Invoice | null = null;
  isSubmitting = false;

  isPreviewOpen = false;
  activePreviewInvoice: Invoice | null = null;
  isGeneratingPdf = false;
  bvaLogo = BVA_LOGO_BASE64;

  // Multiple Items State
  feeItemsList: InvoiceItem[] = [
    { name: 'RECON', subText: 'PART PAYMENT', amount: 100000 }
  ];

  expenseItemsList: InvoiceItem[] = [];

  totalFeeAmount = 0;
  totalExpenseAmount = 0;

  formData: Partial<Invoice> = {
    invoiceNo: '',
    invoiceDate: new Date().toISOString().substring(0, 10),
    clientId: null,
    clientName: '',
    clientAddress: '',
    panNo: '',
    gstin: 'Under RCM applicable to Recipient',
    particularsTitle: 'Bill for Professional Services',
    matter: 'RECON',
    paymentType: 'PART PAYMENT',
    professionalFees: 0,
    outOfPocketExpenses: 0,
    expensesNote: '',
    feeItems: [],
    expenseItems: [],
    totalAmount: 0,
    amountInWords: '',
    bankName: 'Bank of India, Bedipara Br., Rajkot',
    accountName: 'Bharat Vasoya & Associates',
    accountNo: '310820110000514',
    ifscCode: 'BKID0003108',
    firmPan: 'AAHFB3723C',
    jurisdiction: 'Rajkot City',
    status: 'Pending',
    remarks: ''
  };

  // Computed properties
  filteredInvoices = computed(() => {
    let list = this.invoices();
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(i => 
        (i.invoiceNo && i.invoiceNo.toLowerCase().includes(q)) ||
        (i.clientName && i.clientName.toLowerCase().includes(q)) ||
        (i.matter && i.matter.toLowerCase().includes(q)) ||
        (i.status && i.status.toLowerCase().includes(q)) ||
        (i.feeItems && i.feeItems.some(f => f.name.toLowerCase().includes(q) || (f.subText && f.subText.toLowerCase().includes(q)))) ||
        (i.expenseItems && i.expenseItems.some(e => e.name.toLowerCase().includes(q)))
      );
    }
    if (this.selectedStatus !== 'ALL') {
      list = list.filter(i => i.status === this.selectedStatus);
    }
    return list;
  });

  totalInvoicesCount = computed(() => this.invoices().length);

  totalBilledAmount = computed(() => 
    this.invoices().reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0)
  );

  totalPaidAmount = computed(() => 
    this.invoices()
      .filter(i => i.status === 'Paid')
      .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0)
  );

  totalPendingAmount = computed(() => 
    this.invoices()
      .filter(i => i.status === 'Pending' || i.status === 'Partially Paid')
      .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0)
  );

  ngOnInit() {
    this.loadInvoices();
    this.loadClients();
  }

  loadInvoices() {
    this.mastersService.getInvoices().subscribe({
      next: (data) => {
        this.invoices.set(data);
      },
      error: (err) => {
        console.error('Failed to load invoices:', err);
        this.toast.show('Failed to load invoices', 'error');
      }
    });
  }

  loadClients() {
    this.mastersService.getClients().subscribe({
      next: (clients) => {
        this.clientsList.set(clients);
      },
      error: () => {}
    });
  }

  // Multiple Items Methods
  addFeeItem() {
    this.feeItemsList.push({ name: '', subText: '', amount: 0 });
    this.calculateTotal();
  }

  removeFeeItem(index: number) {
    if (this.feeItemsList.length > 1) {
      this.feeItemsList.splice(index, 1);
      this.calculateTotal();
    }
  }

  addExpenseItem() {
    this.expenseItemsList.push({ name: '', subText: '', amount: 0 });
    this.calculateTotal();
  }

  removeExpenseItem(index: number) {
    this.expenseItemsList.splice(index, 1);
    this.calculateTotal();
  }

  openModal(invoice?: Invoice) {
    if (invoice) {
      this.editingInvoice = invoice;
      
      if (invoice.feeItems && invoice.feeItems.length > 0) {
        this.feeItemsList = invoice.feeItems.map(f => ({ ...f, amount: Number(f.amount || 0) }));
      } else {
        this.feeItemsList = [{
          name: invoice.matter || 'RECON',
          subText: invoice.paymentType || 'PART PAYMENT',
          amount: Number(invoice.professionalFees || 0)
        }];
      }

      if (invoice.expenseItems && invoice.expenseItems.length > 0) {
        this.expenseItemsList = invoice.expenseItems.map(e => ({ ...e, amount: Number(e.amount || 0) }));
      } else if (Number(invoice.outOfPocketExpenses || 0) > 0) {
        this.expenseItemsList = [{
          name: invoice.expensesNote || 'Expenses',
          subText: '',
          amount: Number(invoice.outOfPocketExpenses || 0)
        }];
      } else {
        this.expenseItemsList = [];
      }

      this.formData = {
        ...invoice,
        professionalFees: Number(invoice.professionalFees || 0),
        outOfPocketExpenses: Number(invoice.outOfPocketExpenses || 0),
        totalAmount: Number(invoice.totalAmount || 0)
      };
      this.calculateTotal();
    } else {
      this.editingInvoice = null;
      this.feeItemsList = [
        { name: 'RECON', subText: 'PART PAYMENT', amount: 100000 }
      ];
      this.expenseItemsList = [];
      this.formData = {
        invoiceNo: '',
        invoiceDate: new Date().toISOString().substring(0, 10),
        clientId: null,
        clientName: '',
        clientAddress: '',
        panNo: '',
        gstin: 'Under RCM applicable to Recipient',
        particularsTitle: 'Bill for Professional Services',
        matter: 'RECON',
        paymentType: 'PART PAYMENT',
        professionalFees: 100000,
        outOfPocketExpenses: 0,
        expensesNote: '',
        totalAmount: 100000,
        amountInWords: '',
        bankName: 'Bank of India, Bedipara Br., Rajkot',
        accountName: 'Bharat Vasoya & Associates',
        accountNo: '310820110000514',
        ifscCode: 'BKID0003108',
        firmPan: 'AAHFB3723C',
        jurisdiction: 'Rajkot City',
        status: 'Pending',
        remarks: ''
      };
      this.calculateTotal();
      this.fetchNextNumber();
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingInvoice = null;
  }

  fetchNextNumber() {
    this.mastersService.getNextInvoiceNumber().subscribe({
      next: (res) => {
        if (res && res.nextInvoiceNo) {
          this.formData.invoiceNo = res.nextInvoiceNo;
        }
      },
      error: () => {}
    });
  }

  onClientSelected() {
    if (this.formData.clientId) {
      const selected = this.clientsList().find(c => c.id === this.formData.clientId);
      if (selected) {
        this.formData.clientName = selected.name;
        const addrParts: string[] = [];
        if (selected.address) addrParts.push(selected.address);
        if (selected.villageName) addrParts.push(selected.villageName);
        if (selected.talukaName) addrParts.push(selected.talukaName);
        if (selected.districtName) addrParts.push(selected.districtName);
        this.formData.clientAddress = addrParts.join(', ');
      }
    }
  }

  resetDefaultBankDetails() {
    this.formData.bankName = 'Bank of India, Bedipara Br., Rajkot';
    this.formData.accountName = 'Bharat Vasoya & Associates';
    this.formData.accountNo = '310820110000514';
    this.formData.ifscCode = 'BKID0003108';
    this.formData.firmPan = 'AAHFB3723C';
    this.formData.jurisdiction = 'Rajkot City';
  }

  calculateTotal() {
    this.totalFeeAmount = this.feeItemsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    this.totalExpenseAmount = this.expenseItemsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    const grandTotal = this.totalFeeAmount + this.totalExpenseAmount;
    this.formData.professionalFees = this.totalFeeAmount;
    this.formData.outOfPocketExpenses = this.totalExpenseAmount;
    this.formData.totalAmount = grandTotal;

    if (this.feeItemsList.length > 0) {
      this.formData.matter = this.feeItemsList[0].name || '';
      this.formData.paymentType = this.feeItemsList[0].subText || '';
    }

    if (this.expenseItemsList.length > 0) {
      this.formData.expensesNote = this.expenseItemsList.map(e => e.name).filter(Boolean).join(', ');
    }

    this.formData.amountInWords = `TOTAL (${this.numberToIndianWords(grandTotal)})`;
  }

  saveInvoice() {
    if (!this.formData.invoiceNo?.trim()) {
      this.toast.show('Please provide an Invoice Number', 'error');
      return;
    }
    if (!this.formData.clientName?.trim()) {
      this.toast.show('Please provide Client Name', 'error');
      return;
    }

    this.calculateTotal();

    const payload: Partial<Invoice> = {
      ...this.formData,
      feeItems: this.feeItemsList,
      expenseItems: this.expenseItemsList
    };

    this.isSubmitting = true;

    if (this.editingInvoice && this.editingInvoice.id) {
      this.mastersService.updateInvoice({ ...payload, id: this.editingInvoice.id }).subscribe({
        next: () => {
          this.toast.show('Invoice updated successfully', 'success');
          this.isSubmitting = false;
          this.closeModal();
          this.loadInvoices();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Failed to update invoice';
          this.toast.show(msg, 'error');
        }
      });
    } else {
      this.mastersService.createInvoice(payload).subscribe({
        next: () => {
          this.toast.show('Invoice created successfully', 'success');
          this.isSubmitting = false;
          this.closeModal();
          this.loadInvoices();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.message || 'Failed to create invoice';
          this.toast.show(msg, 'error');
        }
      });
    }
  }

  deleteInvoice(invoice: Invoice) {
    Swal.fire({
      title: 'Delete Invoice?',
      text: `Are you sure you want to delete invoice ${invoice.invoiceNo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed && invoice.id) {
        this.mastersService.deleteInvoice(invoice.id).subscribe({
          next: () => {
            this.toast.show('Invoice deleted', 'success');
            this.loadInvoices();
          },
          error: () => {
            this.toast.show('Failed to delete invoice', 'error');
          }
        });
      }
    });
  }

  viewInvoice(invoice: Invoice) {
    this.activePreviewInvoice = invoice;
    this.isPreviewOpen = true;
  }

  closePreview() {
    this.isPreviewOpen = false;
    this.activePreviewInvoice = null;
  }

  printInvoice() {
    window.print();
  }

  getAddressLines(address?: string): string[] {
    if (!address) return [];
    const lines = address.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) return lines;
    return [address.trim()];
  }

  // Direct Make PDF (Generates & Downloads clean PDF file matching exact layout)
  async downloadDirectPdf() {
    const element = document.getElementById('printable-bill-canvas');
    if (!element) {
      this.toast.show('Printable document canvas not found', 'error');
      return;
    }

    this.isGeneratingPdf = true;
    const invNo = this.activePreviewInvoice?.invoiceNo?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'bill';
    const filename = `Bill_${invNo}.pdf`;

    try {
      const opt: any = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 3, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          scrollY: 0,
          windowWidth: 800
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };

      await (html2pdf() as any).set(opt).from(element).save();
      this.toast.show(`PDF downloaded successfully: ${filename}`, 'success');
    } catch (err) {
      console.error('Direct PDF error:', err);
      this.toast.show('Error generating direct PDF, opening print dialog', 'error');
      window.print();
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  // Direct download right from table row
  async directDownloadRowPdf(invoice: Invoice) {
    this.activePreviewInvoice = invoice;
    this.isPreviewOpen = true;

    // Brief delay to ensure DOM has rendered
    setTimeout(() => {
      this.downloadDirectPdf();
    }, 200);
  }

  // Converts numerical amount to Indian Words format (e.g. Rs. One Lakh Only)
  private numberToIndianWords(num: number): string {
    if (!num || num === 0) return 'Rs. Zero Only';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertTwoDigits(n: number): string {
      if (n < 20) return ones[n];
      const ten = Math.floor(n / 10);
      const rem = n % 10;
      return tens[ten] + (rem ? ' ' + ones[rem] : '');
    }

    function convertThreeDigits(n: number): string {
      const hundred = Math.floor(n / 100);
      const rem = n % 100;
      let str = '';
      if (hundred) str += ones[hundred] + ' Hundred';
      if (rem) str += (str ? ' and ' : '') + convertTwoDigits(rem);
      return str;
    }

    const intVal = Math.floor(num);
    const crore = Math.floor(intVal / 10000000);
    const lakh = Math.floor((intVal % 10000000) / 100000);
    const thousand = Math.floor((intVal % 100000) / 1000);
    const hundredRem = intVal % 1000;

    let res = '';
    if (crore) res += convertThreeDigits(crore) + ' Crore ';
    if (lakh) res += convertTwoDigits(lakh) + ' Lakh ';
    if (thousand) res += convertTwoDigits(thousand) + ' Thousand ';
    if (hundredRem) res += convertThreeDigits(hundredRem);

    res = res.trim();
    return `Rs. ${res} Only`;
  }
}
