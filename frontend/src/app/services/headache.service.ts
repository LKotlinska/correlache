import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { HeadacheOptions } from '../models/headache.model';
import { Observable } from 'rxjs';


@Service()
export class HeadacheService {
    private http = inject(HttpClient)

    getOptions(): Observable<HeadacheOptions> {
        return this.http.get<HeadacheOptions>('/api/headaches/options')
    }
}
