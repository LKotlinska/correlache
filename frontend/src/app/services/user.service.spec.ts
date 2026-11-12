import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';
import { getErrorMessage } from '../utils/error-message';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns the export as a Blob', async () => {
    const result = firstValueFrom(service.exportData());
    const body = new Blob(['{"account":{}}'], { type: 'application/json' });
    http.expectOne('/api/user/me/export').flush(body);
    expect(await result).toBe(body);
  });

  it("parses a JSON error body so the server's message can be shown", async () => {
    const result = firstValueFrom(service.exportData());
    const body = new Blob([JSON.stringify({ statusCode: 429, message: 'Too Many Requests' })], { type: 'application/json' });
    http.expectOne('/api/user/me/export').flush(body, { status: 429, statusText: 'Too Many Requests' });

    const err = await result.catch((e: HttpErrorResponse) => e);
    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect(getErrorMessage(err as HttpErrorResponse)).toBe('Too Many Requests');
  });

  it('keeps the error as it is when the body is not JSON', async () => {
    const result = firstValueFrom(service.exportData());
    http.expectOne('/api/user/me/export').flush(new Blob(['<html>bad gateway</html>']), { status: 502, statusText: 'Bad Gateway' });

    const err = (await result.catch((e: HttpErrorResponse) => e)) as HttpErrorResponse;
    expect(err.status).toBe(502);
    expect(getErrorMessage(err)).toBe('Something went wrong. Please try again.');
  });
});
