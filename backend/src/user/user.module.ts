import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UserController } from './user.controller.js';
import { HealthConsentGuard } from './health-consent.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, HealthConsentGuard],
  exports: [UserService, HealthConsentGuard],
})
export class UserModule {}
