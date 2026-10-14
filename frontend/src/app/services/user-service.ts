import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
}

export type authUserPayload = Omit<CreateUserPayload, 'name'>;

@Service()
export class UserService {
    private http = inject(HttpClient);

    createUser(payload: CreateUserPayload) {
        return this.http.post('/api/auth/register', payload);
    }

    authUser(payload: authUserPayload) {
        return this.http.post('/api/auth/login', payload);
    }
    me() {
        return this.http.get('/api/auth/me');
    }
}
