import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { authUserPayload, CreateUserPayload } from '../models/user.model';

@Service()
export class UserService {
    private http = inject(HttpClient);

    createUser(payload: CreateUserPayload) {
        return this.http.post('/api/auth/register', payload);
    }

    authUser(payload: authUserPayload) {
        return this.http.post('/api/auth/login', payload);
    }

    logoutUser() {
        return this.http.post('/api/auth/logout', null);
    }

    me() {
        return this.http.get('/api/auth/me');
    }
}
