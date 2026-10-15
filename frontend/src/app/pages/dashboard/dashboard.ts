import {Component} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

const items = [
  {label: 'Diary', icon: 'book', path: 'diary'},
  {label: 'Insights', icon: 'bar_chart', path: 'insights'},
  {label: 'Settings', icon: 'settings', path: 'settings'},
] as const;

@Component({
  imports: [MatIconModule, RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly items = items;
}
