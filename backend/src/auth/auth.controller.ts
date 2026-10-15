import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public } from '@nestjs/authentication';
import { AuthService } from './auth.service.js';
import { CreateUserDto, LoginDto } from '../user/dto/user.dto.js';
import { User } from '../user/user.entity.js';
import { AUTH_COOKIE, authCookieOptions } from './auth-cookie.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @UseGuards(ThrottlerGuard)
    @Post('register')
    register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { user, token } = await this.authService.login(dto);
        res.cookie(AUTH_COOKIE, token, authCookieOptions());
        return user;
    }

    @Public()
    @Post('logout')
    @HttpCode(204)
    logout(@Res({ passthrough: true }) res: Response) {
        // Same attributes as when set, or the browser keeps the cookie.
        const { maxAge: _, ...options } = authCookieOptions();
        res.clearCookie(AUTH_COOKIE, options);
    }

    @Get('me')
    me(@CurrentUser() user: User) {
        return { id: user.id, username: user.username, email: user.email}
    }
}
