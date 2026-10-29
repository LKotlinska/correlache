import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [MatButtonModule, MatIcon],
  selector: 'app-page-header',
  styleUrl: './page-header.scss',
  templateUrl: './page-header.html',
})
export class PageHeader {
  private location = inject(Location);
  private router = inject(Router);

  title = input.required<string>();

  goBack() {
    // Angular numbers in-app navigations in history.state; 1 means this is the first page of the app
    // (bookmark, typed URL or reload), so back would leave the app and skip the router guards.
    if ((history.state?.navigationId ?? 0) > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/user/diary'], { replaceUrl: true });
    }
  }
}
