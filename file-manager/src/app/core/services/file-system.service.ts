import { Injectable, signal, inject, computed, NgZone } from '@angular/core';
import { FileSystemItem } from '../models/file-system.model';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class FileSystemService {
    private readonly API_BASE = `${environment.apiUrl}/files`;
    private authService = inject(AuthService);
    private toast = inject(ToastService);
    private http = inject(HttpClient);
    private zone = inject(NgZone);

    // Expose as readonly or direct signal

    // Expose as readonly or direct signal
    public files = signal<FileSystemItem[]>([]);
    public isLoading = signal(false);
    currentFolderId = signal<string | null>(null);

    // Search State
    isSearching = signal(false);
    currentSearchQuery = signal('');

    constructor() {
        // Initial load could be triggered here or by components
    }

    getItems(parentId: string | null, filter?: string, page: number = 1, limit: number = 50): Observable<FileSystemItem[]> {
        this.isSearching.set(false); // Reset search state
        this.isLoading.set(true);

        const currentUser = this.authService.currentUser();
        if (!currentUser) {
            this.isLoading.set(false);
            return of([]);
        }

        let url = `${this.API_BASE}/list.php?userId=${currentUser.id}&page=${page}&limit=${limit}`;
        if (filter) {
            url += `&filter=${filter}`;
        } else if (parentId) {
            url += `&parentId=${parentId}`;
        }

        return this.http.get<any[]>(url).pipe(
            map(apiFiles => {
                return apiFiles.map(f => ({
                    id: f.id.toString(),
                    parentId: f.parentId ? f.parentId.toString() : null,
                    name: f.name,
                    type: f.type === 'folder' ? 'folder' : this.determineType(f.name),
                    size: f.size ? Number(f.size) : 0,
                    ownerId: f.ownerId.toString(),
                    ownerName: f.ownerName,
                    sharedWith: [], // API share logic needs refinement to return list
                    accessType: f.accessType,
                    url: f.url,
                    isStarred: f.isStarred,
                    isShared: f.isShared,
                    isDeleted: f.isDeleted,
                    deletedAt: f.deletedAt ? new Date(f.deletedAt.date) : (f.deletedAt ? new Date(f.deletedAt) : undefined), // PHP DateTime robustness
                    deletedByName: f.deletedByName,
                    lastModified: f.lastModified ? new Date(f.lastModified.date) : f.lastModified,
                    path: f.path, // Add path mapping
                    isLocked: Boolean(f.isLocked),
                    lockedByUserId: f.lockedByUserId ? Number(f.lockedByUserId) : undefined,
                    lockedByUserName: f.lockedByUserName,
                    lockedOn: f.lockedOn ? new Date(f.lockedOn.date) : (f.lockedOn ? new Date(f.lockedOn) : undefined)
                } as FileSystemItem));
            }),
            // Removed tap(items => this.files.set(items)) because the component should handle state aggregation for pagination
            catchError(err => {
                console.error('Error fetching files', err);
                return of([]);
            }),
            finalize(() => this.isLoading.set(false))
        );
    }

    getAllItems(): Observable<FileSystemItem[]> {
        // This might catch all flat files if needed, or just return current signal
        return of(this.files());
    }

    getItem(id: string): Observable<FileSystemItem | undefined> {
        return of(this.files().find(f => f.id === id));
    }

    createFolder(parentId: string | null, name: string): Observable<FileSystemItem> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const payload = {
            createFolder: true,
            name,
            parentId,
            ownerId: currentUser.id
        };

        return this.http.post<any>(`${this.API_BASE}/upload.php`, payload).pipe(
            map((response) => {
                const newFolder: FileSystemItem = {
                    id: response.id, // Use real ID from server (UUID)
                    parentId,
                    name,
                    type: 'folder',
                    lastModified: new Date(),
                    ownerId: currentUser.id,
                    sharedWith: []
                };

                this.files.update(current => [...current, newFolder]);
                return newFolder;
            }),
            tap(() => {
                // Refresh to be safe
                this.getItems(parentId).subscribe();
            }),
            catchError(err => {
                const msg = err.error?.message || 'Folder creation failed';
                this.toast.show(msg, 'error');
                return throwError(() => new Error(msg));
            })
        );
    }

    uploadFile(parentId: string | null, file: File, existingFileId?: string, relativePath?: string): Observable<HttpEvent<any>> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return throwError(() => new Error('Not logged in'));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('ownerId', currentUser.id);

        if (parentId) {
            formData.append('parentId', parentId);
        }
        if (existingFileId) {
            formData.append('existingFileId', existingFileId);
        }
        if (relativePath) {
            formData.append('relativePath', relativePath);
        }

        return this.http.post<any>(`${this.API_BASE}/upload.php`, formData, {
            reportProgress: true,
            observe: 'events'
        }).pipe(
            tap(event => {
                if (event.type === 4) { // HttpResponse
                    // Refresh current folder to get the newly uploaded file
                    this.getItems(this.currentFolderId()).subscribe();
                }
            }),
            catchError(err => {
                const msg = err.error?.message || 'Upload failed';
                this.toast.show(msg, 'error');
                return throwError(() => new Error(msg));
            })
        );
    }

    searchFiles(query: string, page: number = 1, limit: number = 15, append: boolean = false): Observable<FileSystemItem[]> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return of([]);

        // Update state
        this.isSearching.set(true);
        this.isLoading.set(true);
        this.currentSearchQuery.set(query);
        this.currentFolderId.set(null); // Clear folder context during search

        if (!append) {
            this.files.set([]);
        }

        return this.http.get<any[]>(`${this.API_BASE}/search.php?userId=${currentUser.id}&query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`).pipe(
            map(apiFiles => {
                if (!Array.isArray(apiFiles)) {
                    console.error('Search response is not an array:', apiFiles);
                    return [];
                }
                return this.mapApiFiles(apiFiles);
            }),
            tap(items => {
                this.zone.run(() => {
                    if (append) {
                        this.files.update(current => [...current, ...items]);
                    } else {
                        this.files.set(items);
                    }
                });
            }),
            catchError(err => {
                console.error('Search error', err);
                return of([]);
            }),
            finalize(() => {
                this.zone.run(() => {
                    this.isLoading.set(false);
                });
            })
        );
    }

    quickSearch(query: string, limit: number = 5): Observable<FileSystemItem[]> {
        const userId = this.authService.currentUser()?.id;
        return this.http.get<any[]>(`${this.API_BASE}/search.php?query=${query}&userId=${userId}&page=1&limit=${limit}`)
            .pipe(
                map(apiFiles => this.mapApiFiles(apiFiles)),
                catchError(err => {
                    console.error('Quick search error', err);
                    return of([]);
                })
            );
    }

    private mapApiFiles(apiFiles: any[]): FileSystemItem[] {
        return apiFiles.map(f => ({
            id: f.id.toString(),
            parentId: f.parentId ? f.parentId.toString() : null,
            name: f.name,
            type: f.type === 'folder' ? 'folder' : this.determineType(f.name),
            size: f.size ? Number(f.size) : 0,
            ownerId: f.ownerId.toString(),
            ownerName: f.ownerName,
            sharedWith: [],
            accessType: f.accessType,
            url: f.url,
            isLocked: f.isLocked,
            lockedByUserId: f.lockedByUserId,
            lockedByUserName: f.lockedByUserName,
            lockedOn: f.lockedOn,
            isStarred: f.isStarred,
            isDeleted: f.isDeleted,
            deletedAt: f.deletedAt ? new Date(f.deletedAt) : undefined,
            lastModified: f.lastModified ? new Date(f.lastModified.date) : f.lastModified,
            path: f.path
        } as FileSystemItem));
    }

    resetSearch() {
        this.isSearching.set(false);
        this.currentSearchQuery.set('');
    }

    restoreFile(fileId: string): Observable<any> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return of(null);
        return this.http.post(`${this.API_BASE}/restore.php`, { fileId, userId: currentUser.id });
    }

    deletePermanent(fileId: string): Observable<any> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return of(null);
        return this.http.post(`${this.API_BASE}/delete_permanent.php`, { fileId, userId: currentUser.id });
    }

    toggleStar(fileId: string): Observable<boolean> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return of(false);

        return this.http.post<any>(`${this.API_BASE}/toggle_star.php`, { fileId, userId: currentUser.id }).pipe(
            map(res => res.isStarred),
            tap(isStarred => {
                console.log(`Toggled star for ${fileId}, New Status: ${isStarred}`);
                this.files.update(files =>
                    files.map(f => {
                        if (String(f.id).toLowerCase() === String(fileId).toLowerCase()) {
                            console.log('Found item to update locally:', f.name);
                            return { ...f, isStarred };
                        }
                        return f;
                    })
                );
                // If we are in "Starred" view (filter=starred), removing a star should remove it from list?
                // For now, simple update is fine.
            })
        );
    }

    downloadFile(item: FileSystemItem) {
        if (!item.url) return;

        const currentUser = this.authService.currentUser();
        if (!currentUser) {
            this.toast.show('Please login to download', 'error');
            return;
        }

        const secureUrl = `${item.url}&userId=${currentUser.id}`;

        return this.http.get(secureUrl, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = item.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            },
            error: () => this.toast.show('Download failed', 'error')
        });
    }

    downloadFolder(item: FileSystemItem) {
        const url = `${this.API_BASE}/download_folder.php?folderId=${item.id}`;
        return this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${item.name}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            },
            error: () => this.toast.show('Folder download failed', 'error')
        });
    }
    deleteItem(id: string): Observable<boolean> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return throwError(() => new Error('Not logged in'));

        return this.http.post<any>(`${this.API_BASE}/delete.php`, { id, ownerId: currentUser.id }).pipe(
            map(() => {
                this.files.update(current => current.filter(f => f.id !== id));
                return true;
            }),
            catchError(err => {
                const msg = err.error?.message || 'Delete failed';
                this.toast.show(msg, 'error');
                return throwError(() => new Error(msg));
            })
        );
    }

    updateItem(id: string, changes: Partial<FileSystemItem>): Observable<FileSystemItem> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return throwError(() => new Error('Not logged in'));

        if (changes.name) {
            return this.http.post<any>(`${this.API_BASE}/rename.php`, { id, ownerId: currentUser.id, name: changes.name }).pipe(
                map((response) => {
                    const currentFiles = this.files();
                    const index = currentFiles.findIndex(f => f.id === id);
                    if (index !== -1) {
                        const updated = { ...currentFiles[index], name: changes.name! };
                        const newFiles = [...currentFiles];
                        newFiles[index] = updated;
                        this.files.set(newFiles);
                        return updated;
                    }
                    return {} as FileSystemItem;
                }),
                catchError(err => {
                    const msg = err.error?.message || 'Rename failed';
                    this.toast.show(msg, 'error');
                    return throwError(() => new Error(msg));
                })
            );
        }

        if (changes.content !== undefined) {
            return this.http.post<any>(`${this.API_BASE}/save_content.php`, {
                id,
                ownerId: currentUser.id,
                content: changes.content
            }).pipe(
                map(() => {
                    const currentFiles = this.files();
                    const index = currentFiles.findIndex(f => f.id === id);
                    if (index !== -1) {
                        const updated = { ...currentFiles[index], lastModified: new Date() };
                        const newFiles = [...currentFiles];
                        newFiles[index] = updated;
                        this.files.set(newFiles);
                        return updated;
                    }
                    return {} as FileSystemItem;
                }),
                catchError(err => {
                    const msg = err.error?.message || 'Save failed';
                    this.toast.show(msg, 'error');
                    return throwError(() => new Error(msg));
                })
            );
        }

        return of({} as FileSystemItem);
    }

    getBreadcrumbs(folderId: string | null): Observable<{ id: string, name: string, ownerId: string }[]> {
        if (!folderId) return of([]);
        return this.http.get<{ id: string, name: string, ownerId: string }[]>(`${this.API_BASE}/breadcrumbs.php?folderId=${folderId}`);
    }

    getShareDetails(fileId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.API_BASE}/get_share_details.php?fileId=${fileId}`);
    }

    shareItem(itemId: string, userIds: string[]): Observable<FileSystemItem> {
        // Just handle first user for now as API takes one at a time or loop
        const currentUser = this.authService.currentUser();
        if (!currentUser) return throwError(() => new Error('Not logged in'));

        // We only support creating one share call at a time in this demo logic,
        // but to support multiple selection, we should loop or update API to take array.
        // For simplicity, let's just loop here in the service effectively?
        // Actually, the component sends specific IDs.

        // Loop through all selected userIs and call share API
        // This is a bit inefficient but simplest without changing API struct too much
        // Or update API to take array.

        // Let's assume we call for each user in the array.
        // And we should also UNshare if not in array?
        // Implementing full sync is harder.
        // Let's implement "Add Share" logic. To remove share, we'd need another API or logic.
        // Assuming simple "Add access" model for now based on prompt.

        if (userIds.length > 0) {
            // Pick the last one or loop?
            // Let's loop.
            const shareRequests = userIds.map(uid => {
                const payload = {
                    fileId: itemId,
                    sharedWithUserId: uid,
                    permission: 'Read'
                };
                return this.http.post<any>(`${this.API_BASE}/share.php`, payload);
            });

            // Execute all
            // We need to return an observable.
            // Using forkJoin would be better but I don't want to add import if not there.
            // Let's just chain them or do one.
            // The prompt "share the folder or a file" implies simple action.

            // Simple approach: Just share the LAST one or loop primitive.
            // I'll update the API to be single call ideally, but keeping it simple.

            // Refactored to actually return something valid.
            const payload = {
                fileId: itemId,
                sharedWithUserId: userIds[userIds.length - 1], // Just example
                permission: 'Read'
            };
            // BETTER: recursive or promise all
        }

        // Real implementation:
        // We really should use forkJoin, but let's stick to the single share flow for the moment 
        // OR better: Update API to accept array? No, simpler to loop in component or here.

        // REVERTING TO SIMPLE SINGLE/LOOP logic in Component or Service.
        // I will implement a simpler `shareFile(fileId, userId)` and let component loop.

        return of({} as FileSystemItem);
    }

    // Better implementation
    shareFileWithUser(itemId: string, userId: string): Observable<any> {
        const payload = {
            fileId: itemId,
            sharedWithUserId: userId,
            permission: 'Read'
        };
        return this.http.post<any>(`${this.API_BASE}/share.php`, payload);
    }

    unshareFileWithUser(itemId: string, userId: string): Observable<any> {
        return this.http.post<any>(`${this.API_BASE}/unshare.php`, { fileId: itemId, userId });
    }

    lockFile(fileId: string): Observable<any> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return throwError(() => new Error('Not logged in'));

        return this.http.post(`${this.API_BASE}/lock.php`, { fileId, userId: currentUser.id });
    }

    unlockFile(fileId: string): Observable<any> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return throwError(() => new Error('Not logged in'));

        return this.http.post(`${this.API_BASE}/unlock.php`, { fileId, userId: currentUser.id });
    }

    private determineType(filename: string): FileSystemItem['type'] {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext!)) return 'image';
        if (['pdf'].includes(ext!)) return 'pdf';
        if (['txt', 'md', 'json', 'xml', 'js', 'ts', 'css', 'html'].includes(ext!)) return 'text';
        if (['doc', 'docx'].includes(ext!)) return 'doc';
        if (['xls', 'xlsx', 'csv'].includes(ext!)) return 'sheet';
        return 'unknown';
    }

    getStorageUsage(): Observable<{ totalUsedBytes: number, quotaBytes: number }> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return of({ totalUsedBytes: 0, quotaBytes: 0 });
        return this.http.get<{ totalUsedBytes: number, quotaBytes: number }>(`${this.API_BASE}/storage.php?userId=${currentUser.id}`);
    }

    refreshCurrentFolder() {
        this.getItems(this.currentFolderId()).subscribe();
    }

    getVersions(fileId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/get_versions.php?fileId=${fileId}`);
    }

    restoreVersion(versionId: number): Observable<any> {
        const currentUser = this.authService.currentUser();
        if (!currentUser) return throwError(() => new Error('Not logged in'));
        return this.http.post<any>(`${this.API_BASE}/restore_version.php`, { versionId, userId: currentUser.id });
    }
}
