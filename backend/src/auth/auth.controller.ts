import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public } from '@nestjs/authentication';
import { AuthService } from './auth.service.js';
import { CreateUserDto, LoginDto } from '../user/dto/user.dto.js';
import { User } from '../user/entities/user.entity.js';
import { AUTH_COOKIE, authCookieOptions, tokenFromCookieHeader } from './auth-cookie.js';
import { JwtCookieAuth } from './jwt-cookie-auth.provider.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtCookieAuth: JwtCookieAuth,
    ) {}

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
    @UseGuards(ThrottlerGuard)
    // The landing page asks on every visit, so 5 per minute like login would lock out normal use
    @Throttle({ default: { limit: 30, ttl: 60_000 } })
    @Get('session')
    async session(@Req() req: Request) {
        const result = await this.jwtCookieAuth.verify(tokenFromCookieHeader(req.headers.cookie));
        return { authenticated: result !== null };
    }

    @Post('logout')
    @HttpCode(204)
    async logout(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
        await this.authService.logout(user.id);
        // Same attributes as when set, or the browser keeps the cookie.
        const { maxAge: _, ...options } = authCookieOptions();
        res.clearCookie(AUTH_COOKIE, options);
    }

    @Get('me')
    me(@CurrentUser() user: User) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            hasHealthDataConsent: !!user.health_data_consent_at,
        }
    }
}
