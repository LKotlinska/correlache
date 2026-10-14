import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { SessionAuth } from './session-auth.provider.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  // Default limit for routes that opt in with ThrottlerGuard: 5 requests per minute per IP.
  imports: [UserModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }])],
  controllers: [AuthController],
  providers: [AuthService, SessionAuth],
})
export class AuthModule {}
