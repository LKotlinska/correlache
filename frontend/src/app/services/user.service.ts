import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { authUserPayload, CreateUserPayload, MeResponse } from '../models/user.model';

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

    deleteAccount() {
        return this.http.delete('/api/user/me');
    }

    me() {
        return this.http.get<MeResponse>('/api/auth/me');
    }

    giveConsent() {
        return this.http.post<void>('/api/user/consent', { healthDataConsent: true });
    }
}
