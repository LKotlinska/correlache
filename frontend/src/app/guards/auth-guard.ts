import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../services/user-service';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  return userService.me().pipe(
    map(() => true), // 200: session is valid, let them in
    catchError((err: HttpErrorResponse) => {
      // Only a 401 means "not logged in"; anything else is a real failure worth telling the user about.
      if (err.status !== 401) {
        snackBar.open('Could not verify your session. Please try again.', 'Close', {
          panelClass: 'snackbar-error',
        });
      }
      return of(router.createUrlTree(['/']));
    }),
  );
};
