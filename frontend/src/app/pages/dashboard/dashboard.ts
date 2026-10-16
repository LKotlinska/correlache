import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

const items = [
  { label: 'Diary', icon: 'note_alt', path: 'diary' },
  { label: 'Insights', icon: 'analytics', path: 'insights' },
  { label: 'Settings', icon: 'settings', path: 'settings' },
] as const;

const EXACT = {
  paths: 'exact',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
} as const;

@Component({
  imports: [MatIconModule, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly items = items;
  private router = inject(Router);

  protected readonly activeItem = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => items.find((i) => this.router.isActive('/user/' + i.path, EXACT))),
    ),
  );
}
