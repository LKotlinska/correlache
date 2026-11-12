import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';

describe('NotFound', () => {
  async function openUnknownUrl(session: 'signed-in' | 'signed-out') {
    TestBed.configureTestingModule({ providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no/such/page');

    const me = TestBed.inject(HttpTestingController).expectOne('/api/auth/me');
    if (session === 'signed-in') me.flush({ id: '1', username: 'Jane', email: 'jane@example.com', hasHealthDataConsent: true });
    else me.flush(null, { status: 401, statusText: 'Unauthorized' });
    await harness.fixture.whenStable();

    return harness.routeNativeElement!;
  }

  it('is shown for a URL no route matches', async () => {
    const page = await openUnknownUrl('signed-out');

    expect(page.textContent).toContain('Page not found');
    expect(TestBed.inject(Router).url).toBe('/no/such/page');
  });

  it('leads a signed-in user to their diary', async () => {
    const link = (await openUnknownUrl('signed-in')).querySelector('a');

    expect(link?.textContent).toContain('Go to your diary');
    expect(link?.getAttribute('href')).toBe('/user');
  });

  it('leads a signed-out user to the start page', async () => {
    const link = (await openUnknownUrl('signed-out')).querySelector('a');

    expect(link?.textContent).toContain('Go to the start page');
    expect(link?.getAttribute('href')).toBe('/');
  });
});
