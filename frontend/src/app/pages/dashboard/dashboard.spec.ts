import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Dashboard } from './dashboard';

@Component({ template: '' })
class Stub {}

describe('Dashboard', () => {
  let harness: RouterTestingHarness;

  const header = () => harness.routeNativeElement!.querySelector('h1')?.textContent?.trim();
  const icon = () =>
    harness.routeNativeElement!.querySelector('header mat-icon')?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'user',
            component: Dashboard,
            children: [
              { path: 'diary', component: Stub },
              { path: 'insights', component: Stub },
              { path: 'settings', component: Stub },
            ],
          },
        ]),
      ],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });

  it('should create', async () => {
    const dashboard = await harness.navigateByUrl('/user/diary', Dashboard);
    expect(dashboard).toBeTruthy();
  });

  it('renders a nav tab for every page', async () => {
    await harness.navigateByUrl('/user/diary', Dashboard);
    const tabs = harness.routeNativeElement!.querySelectorAll('nav a');
    expect(Array.from(tabs).map((t) => t.querySelector('.label')?.textContent?.trim())).toEqual([
      'Diary',
      'Insights',
      'Settings',
    ]);
  });

  it('shows the header of the active page and updates on navigation', async () => {
    await harness.navigateByUrl('/user/diary', Dashboard);
    expect(header()).toBe('Diary');
    expect(icon()).toBe('note_alt');

    await harness.navigateByUrl('/user/insights');
    harness.detectChanges();
    expect(header()).toBe('Insights');
    expect(icon()).toBe('analytics');
  });

  it('ignores query strings and fragments when picking the active page', async () => {
    await harness.navigateByUrl('/user/diary?from=/settings#settings', Dashboard);
    expect(header()).toBe('Diary');
  });

  it('shows an empty header when no child route is active', async () => {
    await harness.navigateByUrl('/user', Dashboard);
    expect(header()).toBe('');
  });
});
