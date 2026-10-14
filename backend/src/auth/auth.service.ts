import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignInService } from '@nestjs/authentication';
import { UserService } from '../user/user.service.js';
import { CreateUserDto, LoginDto } from '../user/dto/user.dto.js';
import { hashPassword, verifyPassword } from '../common/password.js';

// Verified against when the email is unknown, so unknown and known emails take equally long to reject.
const DUMMY_HASH = hashPassword('timing-equalization');

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly signInService: SignInService,
  ) {}

  async register(dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  /** The user without secrets; throws `UnauthorizedException` when the email or password is wrong. */
  async login(dto: LoginDto) {
    const found = await this.userService.findCredentials(dto.email);
    const valid = await verifyPassword(dto.password, found?.password_hash ?? (await DUMMY_HASH));
    if (!found || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Starts the session and sets the HttpOnly cookie on the response.
    await this.signInService.signIn(found.id);
    return { id: found.id, username: found.username, email: found.email };
  }
}
