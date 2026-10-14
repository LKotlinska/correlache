import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignInService } from '@nestjs/authentication';
import { UserService } from '../user/user.service.js';
import { CreateUserDto, LoginDto } from '../user/dto/user.dto.js';
import { verifyPassword } from '../common/password.js';

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
    const valid = found && (await verifyPassword(dto.password, found.password_hash));
    if (!found || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Starts the session and sets the HttpOnly cookie on the response.
    await this.signInService.signIn(found.id);
    return { id: found.id, username: found.username, email: found.email };
  }
}
