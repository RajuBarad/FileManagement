import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    private readonly API_BASE = `${environment.apiUrl}/tasks`; // Adjust if needed

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
}
