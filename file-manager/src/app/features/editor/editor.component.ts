import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FileSystemService } from '../../core/services/file-system.service';
import { FileSystemItem } from '../../core/models/file-system.model';
import { ToastService } from '../../core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Toolbar -->
      <div class="h-16 border-b border-gray-200 flex items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <a routerLink="/files" class="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
            <lucide-icon name="arrow-left" class="h-5 w-5"></lucide-icon>
          </a>
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-2 rounded-lg text-blue-600">
               <lucide-icon [name]="getIcon(item()?.type || 'unknown')" class="h-5 w-5"></lucide-icon>
            </div>
            <div>
              <h1 class="font-semibold text-gray-800">{{ item()?.name }}</h1>
              
              <!-- Menubar -->
              <div class="flex items-center gap-3 text-sm text-gray-600">
                <button class="hover:bg-gray-100 px-1 rounded">File</button>
                <button class="hover:bg-gray-100 px-1 rounded">Edit</button>
                <button class="hover:bg-gray-100 px-1 rounded">View</button>
                <span class="text-xs text-gray-400 ml-2">Last edit was seconds ago</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
           <!-- Collaborators Mock -->
           <div class="flex -space-x-2">
             <div *ngFor="let user of collaborators" class="h-8 w-8 rounded-full border-2 border-white bg-green-500 text-white flex items-center justify-center text-xs font-medium" [title]="user.name">
               {{ user.initials }}
             </div>
           </div>

           <button (click)="save()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2 shadow-sm active:scale-95 transform">
             <lucide-icon name="save" class="h-4 w-4"></lucide-icon>
             Save
           </button>

           <button class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium text-sm flex items-center gap-2">
             <lucide-icon name="share-2" class="h-4 w-4"></lucide-icon>
             Share
           </button>
           
           <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
             JD
           </div>
        </div>
      </div>

      <!-- Editor Canvas -->
      <div class="flex-1 overflow-auto bg-gray-50 p-6 flex justify-center">
        
        <!-- Image Viewer -->
        <div *ngIf="item()?.type === 'image'" class="max-w-full max-h-full shadow-lg rounded-lg overflow-hidden">
           <img [src]="item()?.url" class="max-w-full max-h-full object-contain">
        </div>

        <!-- Spreadsheet Editor (Simple Grid) -->
        <div *ngIf="item()?.type === 'sheet'" class="w-full h-full bg-white shadow-sm border border-gray-300 overflow-auto">
           <div class="sticky top-0 z-10 bg-gray-100 border-b border-gray-300 flex">
             <div class="w-10 border-r border-gray-300 bg-gray-50"></div>
             @for (col of columnHeaders; track col) {
               <div class="flex-1 min-w-[100px] text-center text-gray-500 text-xs py-1 border-r border-gray-300 font-medium bg-gray-50">
                 {{ col }}
               </div>
             }
           </div>
           
           <table class="w-full border-collapse">
             <tbody>
               @for (row of sheetData(); track $index; let r = $index) {
                 <tr>
                   <td class="w-10 border border-gray-300 bg-gray-50 text-center text-xs text-gray-500">{{r + 1}}</td>
                   @for (cell of row; track $index) {
                     <td class="border border-gray-200 p-0 min-w-[100px]">
                       <input [value]="cell" class="w-full h-full outline-none px-2 py-1 text-sm bg-transparent focus:bg-blue-50 border-2 border-transparent focus:border-blue-500 z-0 focus:z-10 relative">
                     </td>
                   }
                 </tr>
               }
             </tbody>
           </table>
        </div>

        <!-- Document (Text) Editor -->
        <div #docEditor *ngIf="item()?.type === 'text'" class="w-full max-w-4xl bg-white shadow-sm min-h-[1100px] p-16 border border-gray-200 outline-none focus:ring-1 ring-gray-200 text-gray-800" contenteditable="true">
           <h1 class="text-4xl font-bold mb-6 text-gray-900">Untitled Document</h1>
           <p class="mb-4 text-lg leading-relaxed">Type @ to insert...</p>
        </div>

        <!-- Word Document Placeholder -->
        <div *ngIf="item()?.type === 'doc'" class="w-full h-full flex flex-col items-center justify-center text-gray-500">
             <lucide-icon name="file-text" class="h-16 w-16 mb-4 text-blue-600"></lucide-icon>
             <h2 class="text-xl font-semibold text-gray-700">Preview not available</h2>
             <p class="mb-6">Microsoft Word documents cannot be previewed here.</p>
             <a [href]="item()?.url" download class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Download File</a>
        </div>

        <!-- PDF Viewer -->
         <div *ngIf="item()?.type === 'pdf'" class="w-full h-full bg-gray-200">
            <iframe *ngIf="pdfUrl" [src]="pdfUrl" class="w-full h-full border-none"></iframe>
         </div>

      </div>
    </div>
  `
})
export class EditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fileService = inject(FileSystemService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);

  item = signal<FileSystemItem | undefined>(undefined);
  sheetData = signal<any[][]>([]);
  pdfUrl: SafeResourceUrl | null = null;

  collaborators = [
    { name: 'Alice Smith', initials: 'AS' },
    { name: 'Bob Jones', initials: 'BJ' }
  ];

  columnHeaders = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const fileId = params['fileId'];
      if (fileId) {
        this.fileService.getItem(fileId).subscribe(item => {
          if (item) {
            this.item.set(item);
            this.loadContent(item);
          }
        });
      }
    });
  }

  loadContent(item: FileSystemItem) {
    if (item.type === 'sheet') {
      if (typeof item.content === 'string') {
        // Loaded from saved state
        try {
          this.sheetData.set(JSON.parse(item.content));
        } catch (e) {
          console.error('Failed to parse sheet data');
        }
      } else {
        // Initialize new sheet
        const rows = Array(30).fill(0).map(() => Array(10).fill(''));
        rows[0][0] = 'Name'; rows[0][1] = 'Role'; rows[0][2] = 'Status';
        this.sheetData.set(rows);
      }
    } else if (item.type === 'text') {
      if (typeof item.content === 'string') {
        setTimeout(() => {
          if (this.docEditor) this.docEditor.nativeElement.innerHTML = item.content!;
        });
      } else if (item.url) {
        // Appending timestamp to bypass browser cache
        this.http.get(`${item.url}?t=${new Date().getTime()}`, { responseType: 'text' }).subscribe({
          next: (text) => {
            setTimeout(() => {
              if (this.docEditor) this.docEditor.nativeElement.innerHTML = text;
            });
          },
          error: () => this.toast.show('Failed to load document content', 'error')
        });
      }
    } else if (item.type === 'pdf' && item.url) {
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(item.url);
    }
  }

  @ViewChild('docEditor') docEditor!: ElementRef;

  save() {
    const currentItem = this.item();
    if (!currentItem) return;

    this.toast.show('Saving...');

    let contentToSave: any = null;

    if (currentItem.type === 'sheet') {
      contentToSave = JSON.stringify(this.sheetData());
    } else if (currentItem.type === 'text' && this.docEditor) {
      contentToSave = this.docEditor.nativeElement.innerHTML;
    }

    // In a real app, this would be an API call. 
    // Here we save the serialized content string to our LocalStorage-backed service.
    this.fileService.updateItem(currentItem.id, {
      lastModified: new Date(),
      content: contentToSave
    }).subscribe(() => {
      setTimeout(() => this.toast.show('Saved to Drive', 'success'), 500);
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'image': return 'image';
      case 'pdf': return 'file-text';
      case 'text': return 'file-text';
      case 'doc': return 'file-type-2';
      case 'sheet': return 'file-spreadsheet';
      default: return 'file';
    }
  }
}
