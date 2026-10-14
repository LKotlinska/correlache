import { Module } from '@nestjs/common';
import { SessionAuth } from './session-auth.provider.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, SessionAuth],
})
export class AuthModule {}
