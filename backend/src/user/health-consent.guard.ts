import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity.js';

/**
 * Refuses requests from users without recorded consent to processing health data (GDPR art. 9(2)(a)).
 * Runs after the global auth guard, which puts the user on the request.
 */
@Injectable()
export class HealthConsentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<{ user?: User | null }>().user;
    if (!user?.health_data_consent_at) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'CONSENT_REQUIRED',
        message: 'Consent to processing health data is required',
      });
    }
    return true;
  }
}
