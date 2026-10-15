import { Injectable, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationProvider, AuthenticationRegistry } from '@nestjs/authentication';
import { User } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';
import { tokenFromCookieHeader } from './auth-cookie.js';

@Injectable()
export class JwtCookieAuth extends AuthenticationProvider<User, { sub: string }> {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    registry: AuthenticationRegistry,
  ) {
    super();
    // Adds this provider to the chain the guard runs for every request.
    registry.registerProvider(this);
  }

  async authenticate(context: ExecutionContext) {
    const token = tokenFromCookieHeader(this.header(context, 'cookie'));
    if (!token) return null;

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      // An expired or tampered cookie counts as "no credentials", like a missing one.
      return null;
    }
    // A deleted user ends the session: the token outlives the account otherwise.
    const user = await this.userService.findById(payload.sub);
    return user ? { user, session: payload } : null;
  }
}
