import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CreateHeadachePayload, Headache, HeadacheDetail, HeadacheOptions } from '../models/headache.model';
import { Observable } from 'rxjs';


@Service()
export class HeadacheService {
    private http = inject(HttpClient)

    create(payload: CreateHeadachePayload){
        return this.http.post<Headache>('/api/headaches', payload);
    };

    getOptions(): Observable<HeadacheOptions> {
        return this.http.get<HeadacheOptions>('/api/headaches/options');
    };

    getHeadaches(): Observable<HeadacheDetail[]> {
        return this.http.get<HeadacheDetail[]>('/api/headaches');
    }

    update(id: string, payload: CreateHeadachePayload) {
        return this.http.put<Headache>(`/api/headaches/${id}`, payload);
    }

    getHeadacheById(id: string): Observable<HeadacheDetail> {
        return this.http.get<HeadacheDetail>(`/api/headaches/${id}`);
    }
}
