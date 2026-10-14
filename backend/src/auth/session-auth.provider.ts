
import { Injectable } from '@nestjs/common';
import { User } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';
import { AuthenticationRegistry, SessionCookieProvider, SessionRecord } from '@nestjs/authentication';


@Injectable()
export class SessionAuth extends SessionCookieProvider<User> {
  constructor(
    private readonly userService: UserService,
    registry: AuthenticationRegistry,
  ) {
    super();
    // Adds this provider to the chain the guard runs for every request.
    registry.registerProvider(this);
  }

  // Called for every request with a live session cookie.
  // Returning null (the user was deleted) ends the session.
  validate(session: SessionRecord) {
    return this.userService.findById(session.userId);
  }
}
