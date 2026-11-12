import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Insights } from './insights';

describe('Insights gate', () => {
  it('shows a notice per category with little data', async () => {
    TestBed.configureTestingModule({ imports: [Insights], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(Insights);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const reqs = http.match(() => true);
    const history = { headaches: { count: 1, firstStartedAt: new Date().toISOString() }, workouts: { count: 0, firstStartedAt: null } };
    for (const r of reqs) {
      if (r.request.url.endsWith('/me/history')) r.flush(history);
      else r.flush(r.request.url.includes('headaches') ? [{ startedAt: new Date().toISOString(), painLevel: 3 }] : []);
    }
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.readiness()?.correlations.ready).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('app-data-notice').length).toBe(4);
  });
});
