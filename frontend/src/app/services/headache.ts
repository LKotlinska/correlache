import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

@Service()
export class Headache {
    private http = inject(HttpClient)

    getLocations() {
        return this.http.get('/api/')
    }
}
