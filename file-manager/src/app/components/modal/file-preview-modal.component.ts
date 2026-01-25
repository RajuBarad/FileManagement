import { Component, ElementRef, ViewChild, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsModule } from '../../core/modules/icons.module';
import { FileSystemItem } from '../../core/models/file-system.model';
import { AuthService } from '../../core/services/auth.service';
import { FilePreviewService } from '../../core/services/file-preview.service';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { renderAsync } from 'docx-preview';

import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';

@Component({
    selector: 'app-file-preview-modal',
    standalone: true,
    imports: [CommonModule, IconsModule, CKEditorModule],
    styles: [`
        :host ::ng-deep .document-editor .ck-editor__editable {
            min-height: 29.7cm;
            padding: 2cm;
            background-color: white;
            box-shadow: none !important;
            border: none !important;
            outline: none !important;
        }
        :host ::ng-deep .document-editor .ck-focused {
            border: none !important;
            box-shadow: none !important;
        }
        /* Hide the default border that CKEditor might add */
        :host ::ng-deep .ck.ck-editor__editable_inline {
            border: none !important;
            overflow: hidden;
        }

        /* Docx Preview Styles */
        :host ::ng-deep .docx-wrapper-custom {
            background: transparent !important; 
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        }
        :host ::ng-deep .docx-wrapper-custom > section.docx {
            background: white !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
            margin-bottom: 40px !important;
            color: black !important;
            flex-shrink: 0 !important;
        }

        /* Hide Headers/Footers if requested */
        :host ::ng-deep .docx-wrapper-custom header,
        :host ::ng-deep .docx-wrapper-custom footer {
            display: none !important;
        }
    `],
    template: `
    <div *ngIf="isOpen()" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" (click)="close()"></div>

      <!-- Modal Content -->
      <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-blue-600">
                <lucide-icon [name]="getIconName()" class="h-5 w-5"></lucide-icon>
            </div>
            <div>
                 <h2 class="text-lg font-bold text-gray-800 dark:text-white truncate max-w-md">{{ file?.name }}</h2>
                 <p class="text-xs text-gray-500">{{ formatSize(file?.size || 0) }} • {{ file?.lastModified | date:'medium' }}</p>
            </div>
          </div>

          <!-- View Mode Switcher (only for Office files) -->
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" *ngIf="fileType === 'office'">
            <button 
                (click)="viewMode.set('quick')" 
                class="px-3 py-1 text-sm rounded-md transition-all"
                [ngClass]="viewMode() === 'quick' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'">
                Quick View
            </button>
            <button 
                (click)="viewMode.set('cloud')" 
                class="px-3 py-1 text-sm rounded-md transition-all"
                [ngClass]="viewMode() === 'cloud' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'">
                Cloud Editor
            </button>
          </div>

          <div class="flex items-center gap-2">

             <button (click)="close()" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition">
                 <lucide-icon name="x" class="h-6 w-6"></lucide-icon>
             </button>
          </div>
        </div>

        <!-- Preview Area -->
        <div class="flex-1 bg-gray-50 dark:bg-black/50 overflow-hidden flex flex-col relative">
            @if (loading()) {
                <div class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-20">
                    <lucide-icon name="loader-2" class="h-8 w-8 text-blue-600 animate-spin"></lucide-icon>
                </div>
            }

            <!-- Office Files: Quick View vs Cloud View -->
            @if (fileType === 'office') {
                <div class="h-full w-full overflow-hidden">
                    <!-- Quick View (Mammoth/XLSX/DocxPreview) -->
                    <div *ngIf="viewMode() === 'quick'" class="h-full w-full overflow-auto bg-gray-200 dark:bg-gray-800 justify-center flex p-8">
                         <!-- Docx Preview Container -->
                         <div #docxContainer class="docx-wrapper-custom"></div>

                         <!-- Classic HTML Content (Excel) -->
                         <div *ngIf="officeContent()" 
                              class="w-[21cm] min-h-[29.7cm] h-fit bg-white text-black shadow-lg p-[2.54cm] mb-8 prose prose-sm max-w-none font-[Calibri,sans-serif]" 
                              [innerHTML]="officeContent()">
                         </div>
                    </div>
                    
                     <!-- Cloud View (CKEditor) -->
                    <div *ngIf="viewMode() === 'cloud'" class="h-full w-full flex flex-col">
                         
                         <!-- Provider Switcher -->
                         <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex gap-2 justify-center">
                            <button (click)="setCloudProvider('ckeditor')" [class.bg-blue-100]="cloudProvider() === 'ckeditor'" class="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700">CKEditor</button>
                            <button (click)="setCloudProvider('offidocs')" [class.bg-blue-100]="cloudProvider() === 'offidocs'" class="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700">OffiDocs</button>
                            <button (click)="setCloudProvider('google')" [class.bg-blue-100]="cloudProvider() === 'google'" class="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Google Docs</button>
                            <button (click)="setCloudProvider('microsoft')" [class.bg-blue-100]="cloudProvider() === 'microsoft'" class="px-3 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Microsoft Office</button>
                         </div>

                         <!-- Iframe for External Providers -->
                         <iframe *ngIf="cloudProvider() !== 'ckeditor'" [src]="cloudUrl" class="flex-1 w-full border-none"></iframe>

                         <!-- CKEditor Document Layout -->
                         <div *ngIf="cloudProvider() === 'ckeditor'" class="flex-1 w-full h-full bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col relative">
                            <!-- Toolbar Container -->
                            <div #toolbarContainer class="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 sticky top-0 shadow-sm"></div>
                            
                            <!-- Document Container (Scrollable) -->
                            <div class="flex-1 overflow-auto p-8 flex justify-center" id="document-scroll-container">
                                <!-- A4 Sheet Simulation -->
                                <div class="w-[21cm] min-h-[29.7cm] bg-white border border-gray-200 shadow-lg mb-8 document-editor mx-auto">
                                    <ckeditor [editor]="Editor" [data]="editorData()" (ready)="onReady($event)"></ckeditor>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            }

            <!-- Other File Types (Simple Preview) -->
            @if (fileType !== 'office') {
                <div class="h-full w-full flex items-center justify-center overflow-auto">
                    <!-- PDF -->
                    @if (fileType === 'pdf' && safeUrl) {
                        <iframe [src]="safeUrl" class="w-full h-full border-none" (load)="loading.set(false)"></iframe>
                    }

                    <!-- Image -->
                    @if (fileType === 'image') {
                        <img [src]="fileUrl" class="max-h-full max-w-full object-contain shadow-lg" (load)="loading.set(false)">
                    }

                    <!-- Video -->
                    @if (fileType === 'video') {
                        <video controls [src]="fileUrl" class="max-h-full max-w-full shadow-lg rounded-lg"></video>
                    }

                    <!-- Audio -->
                    @if (fileType === 'audio') {
                        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                            <div class="h-24 w-24 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                    <lucide-icon name="music" class="h-10 w-10"></lucide-icon>
                            </div>
                            <audio controls [src]="fileUrl" class="w-80"></audio>
                        </div>
                    }

                    <!-- Code -->
                    @if (fileType === 'code') {
                        <div class="w-full h-full p-4 overflow-auto bg-white dark:bg-gray-900 text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre">
                            {{ textContent() }}
                        </div>
                    }

                    <!-- Other -->
                    @if (fileType === 'other') {
                        <div class="text-center p-8">
                            <lucide-icon name="file-question" class="h-16 w-16 text-gray-300 mx-auto mb-4"></lucide-icon>
                            <p class="text-gray-500 mb-4">Preview not available for this file type.</p>

                        </div>
                    }
                </div>
            }
        </div>
      </div>
    </div>
  `
})
export class FilePreviewModalComponent {
    isOpen = signal(false);
    loading = signal(false);
    textContent = signal('');
    officeContent = signal<SafeHtml>('');

    viewMode = signal<'quick' | 'cloud'>('quick');
    cloudProvider = signal<'offidocs' | 'google' | 'microsoft' | 'ckeditor'>('ckeditor');
    cloudUrl: SafeResourceUrl | null = null;
    isLocalhost = false;

    public Editor: any = DecoupledEditor;
    editorData = signal('');

    @ViewChild('docxContainer', { read: ElementRef }) docxContainer?: ElementRef;

    @ViewChild('toolbarContainer', { read: ElementRef }) toolbarContainer?: ElementRef;

    onReady(editor: any) {
        // Insert the toolbar before the editable area.
        const toolbarElement = editor.ui.view.toolbar.element;
        const editableElement = editor.ui.getEditableElement();

        if (this.toolbarContainer && toolbarElement) {
            this.toolbarContainer.nativeElement.appendChild(toolbarElement);
        }

        // DecoupledEditor requires explicit styling for the editable area if not done automatically
        // But we have wrapped it
    }

    file: FileSystemItem | null = null;
    fileUrl: string = '';
    safeUrl: SafeResourceUrl | null = null;
    fileType: 'image' | 'pdf' | 'video' | 'audio' | 'code' | 'office' | 'other' = 'other';

    private sanitizer = inject(DomSanitizer);
    private authService = inject(AuthService);
    private previewService = inject(FilePreviewService);

    constructor() {
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Sync with service
        effect(() => {
            const file = this.previewService.file();
            if (file) {
                this.open(file);
            } else {
                this.closeInternal();
            }
        }, { allowSignalWrites: true });
    }

    open(file: FileSystemItem) {
        this.file = file;
        this.isOpen.set(true);
        this.loading.set(true);
        this.viewMode.set('quick'); // Default to quick view

        const currentUser = this.authService.currentUser();
        const userIdParam = currentUser ? `&userId=${currentUser.id}` : '';

        // Construct Absolute URL for Cloud Viewers
        let baseUrl = environment.apiUrl;
        if (!baseUrl.startsWith('http')) {
            baseUrl = window.location.origin + baseUrl;
        }

        if (file.url) {
            this.fileUrl = file.url.includes('?')
                ? `${file.url}${userIdParam}`
                : `${file.url}?${userIdParam.substring(1)}`;
        } else {
            // Ensure we have an absolute URL for cloud viewers
            this.fileUrl = `${baseUrl}/files/download.php?id=${file.id}${userIdParam}`;
        }

        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
        this.determineType();

        if (this.fileType === 'pdf') {
            this.fileUrl += '&inline=true&t=' + new Date().getTime();
            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl + '#view=FitH&navpanes=1&toolbar=1');
            this.loading.set(false);
        } else if (this.fileType === 'code') {
            this.loadTextContent();
        } else if (this.fileType === 'office') {
            this.loadOfficeContent();
            this.updateCloudUrl(); // Prepare cloud URL just in case
        } else if (this.fileType !== 'image') {
            this.loading.set(false);
        }
    }

    setCloudProvider(provider: 'offidocs' | 'google' | 'microsoft' | 'ckeditor') {
        this.cloudProvider.set(provider);
        this.updateCloudUrl();
    }

    updateCloudUrl() {
        if (this.cloudProvider() === 'ckeditor') {
            setTimeout(() => this.initCKEditor(), 0);
        }
    }

    initCKEditor() {
        this.loading.set(true);

        // 1. Fetch the file content
        fetch(this.fileUrl)
            .then(res => res.arrayBuffer())
            .then(async buffer => {
                let htmlContent = '';

                // 2. Convert DOCX to HTML using Mammoth (since Canvas Editor needs HTML or JSON)
                const ext = this.file?.name.split('.').pop()?.toLowerCase();
                if (ext === 'docx') {
                    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                    htmlContent = result.value;
                } else {
                    htmlContent = '<p>Preview not supported for this format in Document Editor.</p>';
                }

                // 3. Set content for CKEditor
                this.editorData.set(htmlContent);
                this.loading.set(false);

            })
            .catch(err => {
                console.error('Error loading file for CKEditor', err);
                this.loading.set(false);
            });
    }

    loadTextContent() {
        fetch(this.fileUrl)
            .then(res => res.text())
            .then(text => {
                this.textContent.set(text);
                this.loading.set(false);
            })
            .catch(() => {
                this.textContent.set('Error loading content');
                this.loading.set(false);
            });
    }

    async loadOfficeContent() {
        if (!this.fileUrl) return;

        try {
            const buffer = await fetch(this.fileUrl).then(res => res.arrayBuffer());
            const ext = this.file?.name.split('.').pop()?.toLowerCase();

            if (ext === 'docx') {
                // Use docx-preview for Word files (preserves layout/pagination)
                setTimeout(async () => {
                    if (this.docxContainer) {
                        this.docxContainer.nativeElement.innerHTML = '';
                        await renderAsync(buffer, this.docxContainer.nativeElement, undefined, {
                            inWrapper: false, // We provide the wrapper
                            ignoreWidth: false,
                            experimental: true,
                            breakPages: true,
                            ignoreLastRenderedPageBreak: false
                        });
                        this.loading.set(false);
                    }
                }, 0); // Tick to allow viewchild to init
            } else if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const html = XLSX.utils.sheet_to_html(worksheet);
                this.officeContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
                this.loading.set(false);
            } else {
                this.loading.set(false);
            }
        } catch (err) {
            console.error(err);
            this.officeContent.set(this.sanitizer.bypassSecurityTrustHtml('<p class="text-red-500">Error rendering document.</p>'));
            this.loading.set(false);
        }
    }

    close() {
        this.previewService.close(); // Triggers effect -> closeInternal
    }

    private closeInternal() {
        this.isOpen.set(false);
        this.file = null;
        this.textContent.set('');
        this.officeContent.set('');
        this.fileType = 'other';
    }

    determineType() {
        const ext = this.file?.name.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) this.fileType = 'image';
        else if (ext === 'pdf') this.fileType = 'pdf';
        else if (['mp4', 'webm', 'mov'].includes(ext || '')) this.fileType = 'video';
        else if (['mp3', 'wav', 'ogg'].includes(ext || '')) this.fileType = 'audio';
        else if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'php', 'sql'].includes(ext || '')) this.fileType = 'code';
        else if (['docx', 'xlsx', 'xls', 'csv'].includes(ext || '')) this.fileType = 'office';
        else this.fileType = 'other';
    }

    getIconName() {
        switch (this.fileType) {
            case 'image': return 'image';
            case 'pdf': return 'file-text';
            case 'video': return 'video';
            case 'audio': return 'music';
            case 'code': return 'code';
            default: return 'file';
        }
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
