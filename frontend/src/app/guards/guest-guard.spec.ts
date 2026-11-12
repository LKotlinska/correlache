import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { UserService } from '../services/user.service';
import { guestGuard } from './guest-guard';
import { signInRequiredQuery } from './sign-in-redirect';

describe('guestGuard', () => {
  const userService = { me: vi.fn() };
  const account = new UrlTree();
  const router = { createUrlTree: vi.fn() };

  const runGuard = (queryParams: Record<string, string> = {}) => {
    const route = { queryParamMap: convertToParamMap(queryParams) } as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => guestGuard(route, {} as RouterStateSnapshot));
    return typeof result === 'boolean' ? Promise.resolve(result) : firstValueFrom(result as Observable<boolean | UrlTree>);
  };

  beforeEach(() => {
    vi.resetAllMocks();
    router.createUrlTree.mockReturnValue(account);

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('sends a signed-in user to their account', async () => {
    userService.me.mockReturnValue(of({ id: '1', hasHealthDataConsent: true }));

    await expect(runGuard()).resolves.toBe(account);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/user']);
  });

  it('skips the session check when authGuard already found no session', async () => {
    await expect(runGuard(signInRequiredQuery)).resolves.toBe(true);
    expect(userService.me).not.toHaveBeenCalled();
  });

  it('shows the landing page on 401', async () => {
    userService.me.mockReturnValue(throwError(() => ({ status: 401 })));

    await expect(runGuard()).resolves.toBe(true);
  });

  it('shows the landing page when the session check fails', async () => {
    userService.me.mockReturnValue(throwError(() => ({ status: 500 })));

    await expect(runGuard()).resolves.toBe(true);
  });
});
