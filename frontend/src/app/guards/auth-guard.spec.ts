import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { UserService } from '../services/user.service';
import { ConsentPrompt } from '../services/consent-prompt';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  const userService = { me: vi.fn() };
  const snackBar = { open: vi.fn() };
  const landing = new UrlTree();
  const router = { createUrlTree: vi.fn() };
  const consentPrompt = { ask: vi.fn() };

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
        { provide: ConsentPrompt, useValue: consentPrompt },
      ],
    });
  });

  it('lets a logged-in user with recorded consent through', async () => {
    userService.me.mockReturnValue(of({ id: '1', hasHealthDataConsent: true }));

    await expect(runGuard()).resolves.toBe(true);
    expect(consentPrompt.ask).not.toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('asks for consent first and lets the user through once given', async () => {
    userService.me.mockReturnValue(of({ id: '1', hasHealthDataConsent: false }));
    consentPrompt.ask.mockReturnValue(of(true));

    await expect(runGuard()).resolves.toBe(true);
    expect(consentPrompt.ask).toHaveBeenCalledTimes(1);
  });

  it('redirects to the landing page when the user leaves instead of consenting', async () => {
    userService.me.mockReturnValue(of({ id: '1', hasHealthDataConsent: false }));
    consentPrompt.ask.mockReturnValue(of(false));

    await expect(runGuard()).resolves.toBe(landing);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
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
