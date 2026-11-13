import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { inject, Service } from '@angular/core';
import { authUserPayload, CreateUserPayload, HistorySummary, MeResponse } from '../models/user.model';

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

    deleteData() {
        return this.http.delete('/api/user/me/data')
    }

    /** Everything stored about the current user, as a JSON file (GDPR art. 15 and 20). */
    exportData(): Observable<Blob> {
        return this.http.get('/api/user/me/export', { responseType: 'blob' }).pipe(
            catchError((err: HttpErrorResponse) => from(parseBlobError(err)).pipe(switchMap((e) => throwError(() => e)))),
        );
    }

    /** How many headaches and workouts the user has logged and since when, without loading them. */
    historySummary() {
        return this.http.get<HistorySummary>('/api/user/me/history');
    }

    /** Temporary, for public testing: replaces the user's data with a generated example year. */
    loadExampleData() {
        return this.http.post<void>('/api/user/me/example-data', null);
    }

    me() {
        return this.http.get<MeResponse>('/api/auth/me');
    }

    giveConsent() {
        return this.http.post<void>('/api/user/consent', { healthDataConsent: true });
    }

    session() {
        return this.http.get<{ authenticated: boolean}>('/api/auth/session');
    }
}

/**
 * With `responseType: 'blob'` the error body arrives as a Blob too, so `getErrorMessage` can't read it.
 * Returns the error with its JSON body parsed, or unchanged if the body isn't JSON.
 */
async function parseBlobError(err: HttpErrorResponse): Promise<HttpErrorResponse> {
    if (!(err.error instanceof Blob)) return err;
    try {
        const error: unknown = JSON.parse(await err.error.text());
        return new HttpErrorResponse({
            error,
            headers: err.headers,
            status: err.status,
            statusText: err.statusText,
            url: err.url ?? undefined,
        });
    } catch {
        return err;
    }
}
