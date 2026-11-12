import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user.service';
import { inject } from '@angular/core';
import { catchError, map, of, switchMap } from 'rxjs';
import { ConsentPrompt } from '../services/consent-prompt';

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const consentPrompt = inject(ConsentPrompt);

  return userService.me().pipe(
    // 200: session is valid. Accounts without recorded consent must give it before using the app.
    switchMap((me) =>
      me.hasHealthDataConsent
        ? of(true)
        : consentPrompt.ask().pipe(map((consented) => consented || router.createUrlTree(['/']))),
    ),
    catchError((err: HttpErrorResponse) => {
      // Only a 401 means "not logged in"; anything else is a real failure worth telling the user about.
      if (err.status !== 401) {
        snackBar.open('Could not verify your session. Please try again.', 'Close', {
          panelClass: 'snackbar-error',
        });
      }
      // Landing page opens the sign-in dialog when it sees this flag
      return of(err.status === 401 ? router.createUrlTree(['/'], { queryParams: { signIn: 'required' } }) : router.createUrlTree(['/']));
    }),
  );
};
