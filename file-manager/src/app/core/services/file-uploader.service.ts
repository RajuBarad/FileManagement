import { Injectable, inject } from '@angular/core';
import { FileSystemService } from './file-system.service';
import { ToastService } from './toast.service';
import { UploadProgressService } from './upload-progress.service';
import Swal from 'sweetalert2';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class FileUploaderService {
    private fileService = inject(FileSystemService);
    private toast = inject(ToastService);
    private uploadService = inject(UploadProgressService);
    private authService = inject(AuthService);

    private uploadSubscriptions = new Map<string, Subscription>();

    constructor() {
        this.uploadService.cancel$.subscribe(id => {
            const sub = this.uploadSubscriptions.get(id);
            if (sub) {
                sub.unsubscribe();
                this.uploadSubscriptions.delete(id);
                this.toast.show('Upload cancelled', 'info');
            }
        });
    }

    handleFileInput(files: File[]) {
        if (files.length === 0) return;
        const file = files[0];
        const currentFiles = this.fileService.files();
        const duplicate = currentFiles.find(f => f.name === file.name && f.type !== 'folder');

        if (duplicate) {
            this.promptDuplicateFile(file, duplicate.id);
        } else {
            this.uploadFile(file);
        }
    }

    handleFolderInput(files: File[]) {
        if (files.length === 0) return;
        const firstFile = files[0];
        const relativePath = firstFile.webkitRelativePath;
        const folderName = relativePath.split('/')[0];

        const currentFiles = this.fileService.files();
        const duplicateFolder = currentFiles.find(f => f.name === folderName && f.type === 'folder');

        if (duplicateFolder) {
            this.promptDuplicateFolder(files, folderName, duplicateFolder.id);
        } else {
            this.uploadFolder(files, folderName);
        }
    }

    async handleDroppedItems(items: DataTransferItemList) {
        const files: File[] = [];
        const entries: any[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const entry = items[i].webkitGetAsEntry();
                if (entry) entries.push(entry);
            }
        }

        for (const entry of entries) {
            if (entry.isFile) {
                entry.file((file: File) => {
                    this.handleFileInput([file]);
                });
            } else if (entry.isDirectory) {
                this.scanFiles(entry).then(scannedFiles => {
                    this.handleFolderInput(scannedFiles);
                });
            }
        }
    }

    private async scanFiles(entry: any): Promise<File[]> {
        const files: File[] = [];
        const readEntries = (reader: any): Promise<any[]> => {
            return new Promise((resolve, reject) => {
                reader.readEntries((results: any[]) => {
                    if (results.length > 0) {
                        readEntries(reader).then(moreResults => {
                            resolve(results.concat(moreResults));
                        });
                    } else {
                        resolve(results);
                    }
                }, reject);
            });
        }

        const traverse = async (currEntry: any, path: string = '') => {
            if (currEntry.isFile) {
                await new Promise<void>((resolve) => {
                    currEntry.file((file: any) => {
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: path + file.name
                        });
                        files.push(file);
                        resolve();
                    });
                });
            } else if (currEntry.isDirectory) {
                const dirReader = currEntry.createReader();
                const entries = await readEntries(dirReader);
                for (const subEntry of entries) {
                    await traverse(subEntry, path + currEntry.name + '/');
                }
            }
        }

        await traverse(entry);
        return files;
    }

    private promptDuplicateFile(file: File, duplicateId: string) {
        Swal.fire({
            title: 'File already exists',
            text: 'Do you want to replace it or keep both?',
            icon: 'warning',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Replace',
            denyButtonText: 'Keep Both',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.uploadFile(file, duplicateId);
            } else if (result.isDenied) {
                const newName = this.getUniqueName(file.name);
                const renamedFile = new File([file], newName, { type: file.type });
                this.uploadFile(renamedFile);
            }
        });
    }

    private promptDuplicateFolder(files: File[], folderName: string, duplicateId: string) {
        Swal.fire({
            title: 'Folder already exists',
            text: 'Do you want to replace it or keep both?',
            icon: 'warning',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Replace',
            denyButtonText: 'Keep Both',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting existing folder...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
                this.fileService.deleteItem(duplicateId).subscribe({
                    next: () => {
                        Swal.close();
                        this.uploadFolder(files, folderName);
                    },
                    error: (err) => {
                        Swal.close();
                        this.toast.show('Failed to delete existing folder', 'error');
                    }
                });
            } else if (result.isDenied) {
                const newFolderName = this.getUniqueName(folderName, true);
                this.uploadFolder(files, newFolderName);
            }
        });
    }

    private getUniqueName(name: string, isFolder: boolean = false): string {
        const files = this.fileService.files();
        const existingNames = new Set(files.filter(f => (isFolder ? f.type === 'folder' : f.type !== 'folder')).map(f => f.name));

        if (!existingNames.has(name)) return name;

        const extIndex = name.lastIndexOf('.');
        const baseName = isFolder || extIndex === -1 ? name : name.substring(0, extIndex);
        const ext = isFolder || extIndex === -1 ? '' : name.substring(extIndex);

        let counter = 1;
        let newName = `${baseName} (${counter})${ext}`;
        while (existingNames.has(newName)) {
            counter++;
            newName = `${baseName} (${counter})${ext}`;
        }
        return newName;
    }

    private uploadFile(file: File, existingId?: string) {
        const uploadId = 'file-' + Date.now() + Math.random();
        this.uploadService.addUpload({
            id: uploadId,
            name: file.name,
            progress: 0,
            status: 'uploading',
            type: 'file'
        });

        const sub = this.fileService.uploadFile(this.fileService.currentFolderId(), file, existingId).subscribe({
            next: (event) => {
                if (event.type === 1) { // UploadProgress
                    if (event.total) {
                        const progress = Math.round(100 * event.loaded / event.total);
                        this.uploadService.updateProgress(uploadId, progress);
                    }
                } else if (event.type === 4) { // HttpResponse
                    this.uploadService.completeUpload(uploadId);
                    this.uploadSubscriptions.delete(uploadId);
                    if (existingId) {
                        this.toast.show('File replaced successfully', 'success');

                        // Check if file was locked by current user
                        const currentFiles = this.fileService.files();
                        const existingItem = currentFiles.find(f => f.id === existingId);
                        const currentUser = this.authService.currentUser();

                        if (existingItem && existingItem.isLocked && existingItem.lockedByUserId == Number(currentUser?.id)) {
                            Swal.fire({
                                title: 'Unlock File?',
                                text: 'You have updated a locked file. Do you want to unlock it for other users now?',
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonText: 'Yes, Unlock',
                                cancelButtonText: 'No, Keep Locked'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    this.fileService.unlockFile(existingId).subscribe({
                                        next: () => {
                                            this.toast.show('File unlocked', 'success');
                                            this.fileService.refreshCurrentFolder();
                                        },
                                        error: () => this.toast.show('Failed to unlock', 'error')
                                    });
                                }
                            });
                        }


                    } else {
                        this.toast.show('File uploaded successfully', 'success');
                    }
                }
            },
            error: (err) => {
                this.uploadService.failUpload(uploadId);
                this.uploadSubscriptions.delete(uploadId);
                this.toast.show(err.message, 'error');
            }
        });
        this.uploadSubscriptions.set(uploadId, sub);
    }

    private uploadFolder(files: File[], targetFolderName: string) {
        const totalFiles = files.length;
        const uploadId = 'folder-' + Date.now() + Math.random();

        this.uploadService.addUpload({
            id: uploadId,
            name: targetFolderName,
            progress: 0,
            status: 'uploading',
            type: 'folder',
            totalInfo: `0/${totalFiles} files`
        });

        let uploadedCount = 0;
        let errors = 0;

        const uploadNext = (index: number) => {
            if (index >= files.length) {
                if (errors === 0) {
                    this.uploadService.completeUpload(uploadId);
                    this.toast.show('Folder uploaded successfully', 'success');
                } else {
                    if (uploadedCount > 0) {
                        this.uploadService.completeUpload(uploadId);
                        this.toast.show('Folder uploaded with some errors', 'warning');
                    } else {
                        this.uploadService.failUpload(uploadId);
                        this.toast.show('Folder upload failed', 'error');
                    }
                }
                return;
            }

            const file = files[index];
            const relPath = file.webkitRelativePath;
            const pathParts = relPath.split('/');

            // Replace the original root folder name with our target name (handles renaming)
            if (pathParts.length > 0) {
                pathParts[0] = targetFolderName;
            }

            pathParts.pop();
            const directoryPath = pathParts.join('/');

            this.fileService.uploadFile(this.fileService.currentFolderId(), file, undefined, directoryPath).subscribe({
                next: (event) => {
                    if (event.type === 4) { // HttpResponse
                        uploadedCount++;
                        const progress = (uploadedCount / totalFiles) * 100;
                        this.uploadService.updateProgress(uploadId, progress, `${uploadedCount}/${totalFiles}`);
                        uploadNext(index + 1);
                    }
                },
                error: (err) => {
                    console.error(`Failed to upload ${file.name}`, err);
                    errors++;
                    uploadedCount++;
                    const progress = (uploadedCount / totalFiles) * 100;
                    this.uploadService.updateProgress(uploadId, progress, `${uploadedCount}/${totalFiles}`);
                    uploadNext(index + 1);
                }
            });
        };

        uploadNext(0);
    }
}
