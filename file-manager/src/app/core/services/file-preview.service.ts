import { Injectable, signal } from '@angular/core';
import { FileSystemItem } from '../models/file-system.model';

@Injectable({
    providedIn: 'root'
})
export class FilePreviewService {
    file = signal<FileSystemItem | null>(null);

    open(file: FileSystemItem) {
        this.file.set(file);
    }

    close() {
        this.file.set(null);
    }
}
