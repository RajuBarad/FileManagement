import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Country } from '../models/country.model';
import { State } from '../models/state.model';
import { District } from '../models/district.model';
import { Taluka } from '../models/taluka.model';
import { Village } from '../models/village.model';
import { Channel } from '../models/channel.model';
import { Application } from '../models/application.model';
import { ScopeOfWork } from '../models/scope-of-work.model';
import { Client } from '../models/client.model';
import { Followup } from '../models/followup.model';

@Injectable({
    providedIn: 'root'
})
export class MastersService {
    private http = inject(HttpClient);
    private readonly API_BASE = `${environment.apiUrl}/masters`;

    // Country Methods
    getCountries(): Observable<Country[]> {
        return this.http.get<any[]>(`${this.API_BASE}/country/list.php`).pipe(
            map(data => data.map(c => ({
                ...c,
                createdAt: c.createdAt ? new Date(c.createdAt) : undefined
            })))
        );
    }

    createCountry(country: { name: string }): Observable<any> {
        return this.http.post(`${this.API_BASE}/country/create.php`, country);
    }

    updateCountry(country: Country): Observable<any> {
        return this.http.post(`${this.API_BASE}/country/update.php`, country);
    }

    deleteCountry(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/country/delete.php`, { id });
    }

    // State Methods
    getStates(): Observable<State[]> {
        return this.http.get<any[]>(`${this.API_BASE}/state/list.php`).pipe(
            map(data => data.map(s => ({
                ...s,
                createdAt: s.createdAt ? new Date(s.createdAt) : undefined
            })))
        );
    }

    createState(state: { name: string, countryId: number }): Observable<any> {
        return this.http.post(`${this.API_BASE}/state/create.php`, state);
    }

    updateState(state: State): Observable<any> {
        return this.http.post(`${this.API_BASE}/state/update.php`, state);
    }

    deleteState(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/state/delete.php`, { id });
    }

    // District Methods
    getDistricts(): Observable<District[]> {
        return this.http.get<any[]>(`${this.API_BASE}/district/list.php`).pipe(
            map(data => data.map(d => ({
                ...d,
                createdAt: d.createdAt ? new Date(d.createdAt) : undefined
            })))
        );
    }

    createDistrict(district: { name: string, stateId: number }): Observable<any> {
        return this.http.post(`${this.API_BASE}/district/create.php`, district);
    }

    updateDistrict(district: District): Observable<any> {
        return this.http.post(`${this.API_BASE}/district/update.php`, district);
    }

    deleteDistrict(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/district/delete.php`, { id });
    }

    // Taluka Methods (Renamed from Tehsil)
    getTalukas(): Observable<Taluka[]> {
        return this.http.get<any[]>(`${this.API_BASE}/taluka/list.php`).pipe(
            map(data => data.map(t => ({
                ...t,
                createdAt: t.createdAt ? new Date(t.createdAt) : undefined
            })))
        );
    }

    createTaluka(taluka: { name: string, districtId: number }): Observable<any> {
        return this.http.post(`${this.API_BASE}/taluka/create.php`, taluka);
    }

    updateTaluka(taluka: Taluka): Observable<any> {
        return this.http.post(`${this.API_BASE}/taluka/update.php`, taluka);
    }

    deleteTaluka(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/taluka/delete.php`, { id });
    }

    // Village Methods
    getVillages(): Observable<Village[]> {
        return this.http.get<any[]>(`${this.API_BASE}/village/list.php`).pipe(
            map(data => data.map(v => ({
                ...v,
                createdAt: v.createdAt ? new Date(v.createdAt) : undefined
            })))
        );
    }

    createVillage(village: { name: string, talukaId: number }): Observable<any> {
        return this.http.post(`${this.API_BASE}/village/create.php`, village);
    }

    updateVillage(village: Village): Observable<any> {
        return this.http.post(`${this.API_BASE}/village/update.php`, village);
    }

    deleteVillage(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/village/delete.php`, { id });
    }

    // Channel Methods
    getChannels(): Observable<Channel[]> {
        return this.http.get<any[]>(`${this.API_BASE}/channel/list.php`).pipe(
            map(data => data.map(c => ({
                ...c,
                isDefault: !!c.isDefault,
                sequence: c.sequence ? Number(c.sequence) : 0,
                createdAt: c.createdAt ? new Date(c.createdAt) : undefined
            })))
        );
    }

    createChannel(channel: { name: string, reminderDays: number, isDefault?: boolean, sequence?: number }): Observable<any> {
        return this.http.post(`${this.API_BASE}/channel/create.php`, channel);
    }

    updateChannel(channel: Channel): Observable<any> {
        return this.http.post(`${this.API_BASE}/channel/update.php`, channel);
    }

    updateChannelSequences(ids: number[]): Observable<any> {
        return this.http.post(`${this.API_BASE}/channel/update_sequence.php`, { ids });
    }

    deleteChannel(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/channel/delete.php`, { id });
    }

    // Scope of Work Methods
    getScopesOfWork(): Observable<ScopeOfWork[]> {
        return this.http.get<any[]>(`${this.API_BASE}/scope-of-work/list.php`).pipe(
            map(data => data.map(s => ({
                ...s,
                createdAt: s.createdAt ? new Date(s.createdAt) : undefined
            })))
        );
    }

    createScopeOfWork(scope: { name: string }): Observable<any> {
        return this.http.post(`${this.API_BASE}/scope-of-work/create.php`, scope);
    }

    updateScopeOfWork(scope: ScopeOfWork): Observable<any> {
        return this.http.post(`${this.API_BASE}/scope-of-work/update.php`, scope);
    }

    deleteScopeOfWork(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/scope-of-work/delete.php`, { id });
    }

    // Client Methods
    getClients(): Observable<Client[]> {
        return this.http.get<any[]>(`${this.API_BASE}/client/list.php`).pipe(
            map(data => data.map(c => ({
                ...c,
                createdAt: c.createdAt ? new Date(c.createdAt) : undefined
            })))
        );
    }

    createClient(client: Client): Observable<any> {
        return this.http.post(`${this.API_BASE}/client/create.php`, client);
    }

    updateClient(client: Client): Observable<any> {
        return this.http.post(`${this.API_BASE}/client/update.php`, client);
    }

    deleteClient(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/client/delete.php`, { id });
    }

    // Application Methods
    getApplications(): Observable<Application[]> {
        return this.http.get<any[]>(`${this.API_BASE}/application/list.php`).pipe(
            map(data => data.map(a => ({
                ...a,
                channelId: a.channelId ? Number(a.channelId) : null,
                followupId: a.followupId ? Number(a.followupId) : null,
                isCompleted: !!a.isCompleted,
                isClosed: !!a.isClosed,
                assignees: a.assignees ? a.assignees.map((asg: any) => ({ ...asg, id: Number(asg.id) })) : [],
                createdAt: a.createdAt ? new Date(a.createdAt) : undefined
            })))
        );
    }

    createApplication(application: Application): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/create.php`, application);
    }

    updateApplication(application: Application): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/update.php`, application);
    }

    updateApplicationChannel(id: number, channelId: number | null): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/update_channel.php`, { id, channelId });
    }

    updateApplicationFollowup(id: number, followupId: number | null): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/update_followup.php`, { id, followupId });
    }

    deleteApplication(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/delete.php`, { id });
    }

    // Application Comments & Attachments Methods
    getApplicationComments(applicationId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/application/get_comments.php?applicationId=${applicationId}`).pipe(
            map(comments => comments.map(c => ({
                ...c,
                createdAt: new Date(c.createdAt)
            })))
        );
    }

    addApplicationComment(applicationId: number, userId: number | string, content: string): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/add_comment.php`, { applicationId, userId, content });
    }

    getApplicationAttachments(applicationId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_BASE}/application/get_attachments.php?applicationId=${applicationId}`);
    }

    attachApplicationFile(applicationId: number, fileId: string): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/attach_file.php`, { applicationId, fileId });
    }

    removeApplicationAttachment(id: string): Observable<any> {
        return this.http.get(`${this.API_BASE}/application/remove_attachment.php?id=${id}`);
    }

    // Followup Methods
    getFollowups(): Observable<Followup[]> {
        return this.http.get<any[]>(`${this.API_BASE}/followup/list.php`).pipe(
            map(data => data.map(f => ({
                ...f,
                isDefault: !!f.isDefault,
                isCompleted: !!f.isCompleted,
                sequence: f.sequence ? Number(f.sequence) : 0,
                createdAt: f.createdAt ? new Date(f.createdAt) : undefined
            })))
        );
    }

    createFollowup(followup: { name: string, reminderDays: number, isDefault?: boolean, isCompleted?: boolean, sequence?: number }): Observable<any> {
        return this.http.post(`${this.API_BASE}/followup/create.php`, followup);
    }

    updateFollowup(followup: Followup): Observable<any> {
        return this.http.post(`${this.API_BASE}/followup/update.php`, followup);
    }

    updateFollowupSequences(ids: number[]): Observable<any> {
        return this.http.post(`${this.API_BASE}/followup/update_sequence.php`, { ids });
    }

    deleteFollowup(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/followup/delete.php`, { id });
    }

    markApplicationCompleted(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/mark_completed.php`, { id });
    }

    closeApplication(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/close_task.php`, { id });
    }

    reopenApplication(id: number): Observable<any> {
        return this.http.post(`${this.API_BASE}/application/reopen_task.php`, { id });
    }
}
