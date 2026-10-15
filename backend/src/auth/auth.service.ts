import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { CreateUserDto, LoginDto } from '../user/dto/user.dto.js';
import { hashPassword, verifyPassword } from '../common/password.js';

// Verified against when the email is unknown, so unknown and known emails take equally long to reject.
const DUMMY_HASH = hashPassword('timing-equalization');

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  /** The user without secrets plus the auth token; throws `UnauthorizedException` when the email or password is wrong. */
  async login(dto: LoginDto) {
    const found = await this.userService.findCredentials(dto.email);
    const valid = await verifyPassword(dto.password, found?.password_hash ?? (await DUMMY_HASH));
    if (!found || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return {
      user: { id: found.id, username: found.username, email: found.email },
      token: await this.jwtService.signAsync({ sub: found.id }),
    };
  }
}
