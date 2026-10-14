import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user-service';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);
  
    return userService.me().pipe(
    map(() => true),                          // 200: session is valid, let them in
    catchError(() => of(router.createUrlTree(['/']))), // 401: back to the landing page
  );
};
