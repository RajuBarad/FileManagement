import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface UserActivityLog {
  id: number;
  userId: string | null;
  userName: string;
  userRole: string;
  module: string;
  action: string;
  entityName: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface UserHistoryStats {
  totalActivities: number;
  todayCount: number;
  activeUserCount: number;
  modules: Record<string, number>;
}

export interface UserHistoryResponse {
  status: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: UserActivityLog[];
  stats: UserHistoryStats;
}

export interface HistoryFilterParams {
  userId?: string | null;
  module?: string | null;
  action?: string | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserHistoryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly API_BASE = `${environment.apiUrl}/history`;

  getHistory(filters: HistoryFilterParams = {}): Observable<UserHistoryResponse> {
    let params = new HttpParams();

    if (filters.userId && filters.userId !== 'all') {
      params = params.set('userId', filters.userId);
    }
    if (filters.module && filters.module !== 'all') {
      params = params.set('module', filters.module);
    }
    if (filters.action && filters.action !== 'all') {
      params = params.set('action', filters.action);
    }
    if (filters.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<UserHistoryResponse>(`${this.API_BASE}/list.php`, { params });
  }

  logActivity(module: string, action: string, entityName?: string | null, entityId?: string | null, details?: string | null): Observable<any> {
    const user = this.auth.currentUser();
    const payload = {
      userId: user?.id || null,
      userName: user?.name || null,
      userRole: user?.role || null,
      module,
      action,
      entityName: entityName || null,
      entityId: entityId || null,
      details: details || null
    };

    return this.http.post<any>(`${this.API_BASE}/log.php`, payload);
  }

  exportToCsv(logs: UserActivityLog[]) {
    if (!logs || logs.length === 0) return;

    const headers = ['ID', 'Date & Time', 'User Name', 'Role', 'Module', 'Action', 'Entity', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      l.id,
      `"${l.createdAt}"`,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      `"${l.userRole || ''}"`,
      `"${l.module}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.entityName || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
