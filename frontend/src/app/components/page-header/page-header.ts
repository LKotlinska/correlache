import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);

  title = input.required<string>();
  /** Where back goes when there is no in-app history; a relative path resolves against the current route. */
  fallback = input('/user/diary');

  goBack() {
    // Angular numbers in-app navigations in history.state; 1 means this is the first page of the app
    // (bookmark, typed URL or reload), so back would leave the app and skip the router guards.
    if ((history.state?.navigationId ?? 0) > 1) {
      this.location.back();
    } else {
      this.router.navigate([this.fallback()], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
