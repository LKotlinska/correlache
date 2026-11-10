import { Body, Controller, Delete, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '@nestjs/authentication';
import { UserService } from './user.service.js';
import { User } from './entities/user.entity.js';
import { GiveConsentDto } from './dto/user.dto.js';
import { AUTH_COOKIE, authCookieOptions } from '../auth/auth-cookie.js';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    /** Records consent to processing health data, for accounts created before signup asked for it. */
    @Post('consent')
    @HttpCode(204)
    // The body is validated but unused: it makes the request state consent explicitly, as signup does
    async giveConsent(@CurrentUser() user: User, @Body() _dto: GiveConsentDto): Promise<void> {
        await this.userService.giveConsent(user.id);
    }

    /** Deletes the current user; their headaches and workouts go with them (FK cascade). */
    @Delete('me')
    @HttpCode(204)
    async removeMe(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
        await this.userService.remove(user.id);
        const { maxAge: _, ...options } = authCookieOptions();
        res.clearCookie(AUTH_COOKIE, options);
    }
}
