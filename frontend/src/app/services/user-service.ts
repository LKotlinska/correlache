import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
}

@Service()
export class UserService {
    private http = inject(HttpClient);

    createUser(payload: CreateUserPayload) {
        return this.http.post('/api/user', payload);
    }
}
