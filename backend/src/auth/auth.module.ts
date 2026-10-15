import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtCookieAuth } from './jwt-cookie-auth.provider.js';
import { AUTH_TTL_SECONDS } from './auth-cookie.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  // Default limit for routes that opt in with ThrottlerGuard: 5 requests per minute per IP.
  imports: [
    UserModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      // getOrThrow fails the boot with a clear message instead of signing with an undefined key.
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: AUTH_TTL_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtCookieAuth],
})
export class AuthModule {}
