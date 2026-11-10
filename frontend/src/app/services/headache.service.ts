import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CreateHeadachePayload, Headache, HeadacheDetail, HeadacheOptions } from '../models/headache.model';
import { Observable } from 'rxjs';
import { dateRangeParams } from '../utils/date';


@Service()
export class HeadacheService {
    private http = inject(HttpClient)

    create(payload: CreateHeadachePayload){
        return this.http.post<Headache>('/api/headaches', payload);
    };

    getOptions(): Observable<HeadacheOptions> {
        return this.http.get<HeadacheOptions>('/api/headaches/options');
    };

    /**
     * Headaches newest first, optionally only those started from `from` (inclusive) until `to` (exclusive), and at
     * most `limit`. Their doses are only included with `withIntakes`.
     */
    getHeadaches(range: { from?: Date; to?: Date; limit?: number } = {}, withIntakes = false): Observable<Headache[]> {
        const params = { ...dateRangeParams(range), ...(withIntakes && { withIntakes: 'true' }) };
        return this.http.get<Headache[]>('/api/headaches', { params });
    }

    update(id: string, payload: CreateHeadachePayload) {
        return this.http.put<Headache>(`/api/headaches/${id}`, payload);
    }

    delete(id: string) {
        return this.http.delete<void>(`/api/headaches/${id}`);
    }

    getHeadacheById(id: string): Observable<HeadacheDetail> {
        return this.http.get<HeadacheDetail>(`/api/headaches/${id}`);
    }
}
