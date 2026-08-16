import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Task, CreateTaskRequest } from '../models/task.model';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_BASE = `${environment.apiUrl}/tasks`;

    // Global Modal State
    private openModalSource = new Subject<{ mode: 'create' | 'edit' | 'comments', task?: Task, initialStatus?: string }>();
    public modalRequest$ = this.openModalSource.asObservable();

    // Refresh Trigger for Dashboard
    private refreshParamsSource = new Subject<void>();
    public refreshTasks$ = this.refreshParamsSource.asObservable();

    openModal(mode: 'create' | 'edit' | 'comments', task?: Task, initialStatus?: string) {
        this.openModalSource.next({ mode, task, initialStatus });
    }

    triggerRefresh() {
        this.refreshParamsSource.next();
    }

    readonly defaultSections = [
        { id: 'Pending', name: 'To Do', color: 'gray', isCompletedSection: false },
        { id: 'In Progress', name: 'In Progress', color: 'blue', isCompletedSection: false },
        { id: 'Review', name: 'Review', color: 'purple', isCompletedSection: false },
        { id: 'Done', name: 'Done', color: 'green', isCompletedSection: true }
    ];

    fetchBoardSections(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/sections.php`).pipe(
            map(sections => {
                if (sections && sections.length > 0) {
                    localStorage.setItem('task_board_sections', JSON.stringify(sections));
                }
                return sections;
            })
        );
    }

    getBoardSections(): { id: string; name: string; color: string; isCustom?: boolean; isCompletedSection?: boolean }[] {
        try {
            const stored = localStorage.getItem('task_board_sections');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch {}
        return this.defaultSections;
    }

    saveBoardSections(sections: { id: string; name: string; color: string; isCustom?: boolean; isCompletedSection?: boolean }[]) {
        localStorage.setItem('task_board_sections', JSON.stringify(sections));
        this.http.post(`${this.API_BASE}/sections.php`, sections).subscribe({
            error: (err) => console.error('Failed to sync board sections to backend', err)
        });
    }

    getCustomSections(): string[] {
        return this.getBoardSections().map(s => s.name);
    }

    getTasks(showArchived: boolean = false): Observable<Task[]> {
        const userId = this.authService.currentUser()?.id;
        return this.http.get<any[]>(`${this.API_BASE}/list.php?userId=${userId}&showArchived=${showArchived}`).pipe(
            map(tasks => tasks.map(t => ({
                ...t,
                dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
                createdAt: new Date(t.createdAt),
                updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
                completedAt: t.completedAt ? new Date(t.completedAt) : undefined
            })))
        );
    }

    createTask(task: CreateTaskRequest): Observable<any> {
        return this.http.post(`${this.API_BASE}/create.php`, task);
    }

    updateStatus(taskId: string, status: string): Observable<any> {
        return this.http.post(`${this.API_BASE}/update_status.php`, { taskId, status });
    }

    deleteTask(taskId: string): Observable<any> {
        return this.http.get(`${this.API_BASE}/delete.php?id=${taskId}`);
    }

    updateTask(task: any): Observable<any> {
        return this.http.post(`${this.API_BASE}/update.php`, task);
    }

    getComments(taskId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/get_comments.php?taskId=${taskId}`).pipe(
            map(comments => comments.map(c => ({
                ...c,
                createdAt: new Date(c.createdAt)
            })))
        );
    }

    addComment(taskId: string, userId: string, content: string): Observable<any> {
        return this.http.post(`${this.API_BASE}/add_comment.php`, { taskId, userId, content });
    }

    attachFile(taskId: string, fileId: string): Observable<any> {
        return this.http.post(`${this.API_BASE}/attach_file.php`, { taskId, fileId });
    }

    getAttachments(taskId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/get_attachments.php?taskId=${taskId}`).pipe(
            map(files => files.map(f => ({
                ...f,
                createdAt: new Date(f.createdAt)
            })))
        );
    }

    removeAttachment(attachmentId: string): Observable<any> {
        return this.http.get(`${this.API_BASE}/remove_attachment.php?id=${attachmentId}`);
    }

    getSubTasks(parentTaskId: string): Observable<Task[]> {
        return this.http.get<any[]>(`${this.API_BASE}/get_subtasks.php?parentTaskId=${parentTaskId}`).pipe(
            map(tasks => tasks.map(t => ({
                ...t,
                dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
                createdAt: new Date(t.createdAt),
                updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
                completedAt: t.completedAt ? new Date(t.completedAt) : undefined
            })))
        );
    }

    getUserTaskStats(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/user_task_stats.php`);
    }

    getHierarchyTasksList(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/hierarchy_tasks_list.php`);
    }
}
