import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { UserService } from '../services/user.service';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const userService = { me: vi.fn() };
  const snackBar = { open: vi.fn() };
  const landing = new UrlTree();
  const router = { createUrlTree: vi.fn() };

  const runGuard = () =>
    firstValueFrom(
      TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ) as Observable<boolean | UrlTree>,
    );

  beforeEach(() => {
    vi.resetAllMocks();
    router.createUrlTree.mockReturnValue(landing);

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
  });

  it('lets a logged-in user through', async () => {
    userService.me.mockReturnValue(of({ id: '1' }));

    await expect(runGuard()).resolves.toBe(true);
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('redirects to the landing page silently on 401', async () => {
    userService.me.mockReturnValue(throwError(() => ({ status: 401 })));

    await expect(runGuard()).resolves.toBe(landing);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('redirects and shows a snackbar on other errors', async () => {
    userService.me.mockReturnValue(throwError(() => ({ status: 500 })));

    await expect(runGuard()).resolves.toBe(landing);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Could not verify your session. Please try again.',
      'Close',
      expect.objectContaining({ panelClass: 'snackbar-error' }),
    );
  });
});
