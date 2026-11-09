import { inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Returns a function that goes back in history, or to `fallback` when there is no in-app history.
 * A relative fallback resolves against the route of the component that called this.
 * Must be called in an injection context (a field initializer or constructor).
 */
export function injectGoBack() {
  const location = inject(Location);
  const router = inject(Router);
  const route = inject(ActivatedRoute);

  return (fallback: string) => {
    // Angular numbers in-app navigations in history.state; 1 means this is the first page of the app
    // (bookmark, typed URL or reload), so back would leave the app and skip the router guards.
    if ((history.state?.navigationId ?? 0) > 1) {
      location.back();
    } else {
      router.navigate([fallback], { relativeTo: route, replaceUrl: true });
    }
  };
}
