import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface UploadItem {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    type: 'file' | 'folder';
    totalInfo?: string; // e.g., "1/10 files" for folders
}

@Injectable({
    providedIn: 'root'
})
export class UploadProgressService {
    uploads = signal<UploadItem[]>([]);
    isMinimized = signal(false);

    // Event emitter for cancellation
    private cancelSource = new Subject<string>();
    cancel$ = this.cancelSource.asObservable();

    addUpload(item: UploadItem) {
        this.uploads.update(current => [item, ...current]);
        this.isMinimized.set(false); // Auto open on new upload
    }

    cancelUpload(id: string) {
        this.cancelSource.next(id);
        // Mark as error/cancelled immediately in UI
        this.uploads.update(current => current.map(item =>
            item.id === id ? { ...item, status: 'error', totalInfo: 'Cancelled' } : item
        ));
    }

    updateProgress(id: string, progress: number, totalInfo?: string) {
        this.uploads.update(current => current.map(item =>
            item.id === id ? { ...item, progress, totalInfo } : item
        ));
    }

    completeUpload(id: string) {
        this.uploads.update(current => current.map(item =>
            item.id === id ? { ...item, progress: 100, status: 'completed' } : item
        ));
        // Optional: Remove completed items after a delay? 
        // For now, keep them so user can see history until they close/refresh.
    }

    failUpload(id: string) {
        this.uploads.update(current => current.map(item =>
            item.id === id ? { ...item, status: 'error' } : item
        ));
    }

    toggleMinimize() {
        this.isMinimized.update(v => !v);
    }

    close() {
        this.uploads.set([]);
    }
}
