import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

class HeadacheOptions {
    
}

@Service()
export class HeadacheService {
    private http = inject(HttpClient)

    getOptions() {
        return this.http.get('/api/headaches/options')
    }
}
