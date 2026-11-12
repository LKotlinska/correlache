import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { HealthConsentGuard } from './health-consent.guard.js';

describe('HealthConsentGuard', () => {
  const guard = new HealthConsentGuard();
  const contextFor = (user: unknown) =>
    ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as ExecutionContext;

  it('lets a user with recorded consent through', () => {
    expect(guard.canActivate(contextFor({ id: '1', health_data_consent_at: new Date() }))).toBe(true);
  });

  it.each([
    ['no recorded consent', { id: '1', health_data_consent_at: null }],
    ['no user', null],
  ])('refuses with CONSENT_REQUIRED when there is %s', (_label, user) => {
    const error = (() => {
      try {
        guard.canActivate(contextFor(user));
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toMatchObject({ statusCode: 403, code: 'CONSENT_REQUIRED' });
  });
});
