import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { UserService } from '../services/user.service';
import { SIGN_IN_PARAM, SIGN_IN_REQUIRED } from './sign-in-redirect';

/** Keeps signed-in users off the landing page by sending them to their account instead. */
export const guestGuard: CanActivateFn = (route) => {
  // authGuard only adds this after /me returned 401, so there's no session to check
  if (route.queryParamMap.get(SIGN_IN_PARAM) === SIGN_IN_REQUIRED) {
    return true;
  }

  const userService = inject(UserService);
  const router = inject(Router);

  return userService.session().pipe(
    map(({ authenticated }) => (authenticated ? router.createUrlTree(['/user']) : true)),
      // Network or server failure: show the landing page
    catchError(() => of(true)),
  );
};
