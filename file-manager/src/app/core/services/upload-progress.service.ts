import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface UploadItem {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    type: 'file' | 'folder';
    totalInfo?: string; // e.g., "1/10 files" for folders
    errorCount?: number;
    errorMessage?: string;
    parentId?: string; // ID of the folder this item belongs to
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
        this.uploads.update(current => {
            if (item.parentId) {
                const parentIndex = current.findIndex(u => u.id === item.parentId);
                if (parentIndex !== -1) {
                    const next = [...current];
                    // Insert after parent (and after any other children already there)
                    let lastChildIndex = parentIndex;
                    for (let i = parentIndex + 1; i < next.length; i++) {
                        if (next[i].parentId === item.parentId) {
                            lastChildIndex = i;
                        } else {
                            break;
                        }
                    }
                    next.splice(lastChildIndex + 1, 0, item);
                    return next;
                }
            }
            return [item, ...current];
        });
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
