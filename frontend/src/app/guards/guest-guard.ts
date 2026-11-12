import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { UserService } from '../services/user.service';

/** Keeps signed-in users off the landing page by sending them to their account instead. */
export const guestGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.me().pipe(
    map(() => router.createUrlTree(['/user'])),
    // 401 (or any other failure): treat as signed out and show the landing page
    catchError(() => of(true)),
  );
};
