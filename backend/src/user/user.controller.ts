import { Body, Controller, Delete, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '@nestjs/authentication';
import { UserService } from './user.service.js';
import { ExportService } from './export.service.js';
import { HistorySummaryService } from './history-summary.service.js';
import type { HistorySummary } from './history-summary.service.js';
import { HealthConsentGuard } from './health-consent.guard.js';
import { User } from './entities/user.entity.js';
import { GiveConsentDto } from './dto/user.dto.js';
import { AUTH_COOKIE, authCookieOptions } from '../auth/auth-cookie.js';

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly exportService: ExportService,
        private readonly historySummaryService: HistorySummaryService,
    ) {}

    /**
     * Downloads everything stored about the current user as JSON (GDPR art. 15 and 20).
     * Not behind HealthConsentGuard: the right of access holds whether or not consent was given.
     */
    @Get('me/export')
    // Each call loads the user's whole history, so it's limited like the auth routes (5 per minute per IP, counted per route)
    @UseGuards(ThrottlerGuard)
    async exportMe(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
        const data = await this.exportService.exportUser(user.id);
        // No date here: the server can't know the user's local day. The web app adds it when saving.
        res.setHeader('Content-Disposition', 'attachment; filename="correlache-export.json"');
        res.setHeader('Cache-Control', 'no-store');
        return data;
    }

    /** How many headaches and workouts the user has logged and since when, without loading them. */
    @Get('me/history')
    @UseGuards(HealthConsentGuard)
    history(@CurrentUser() user: User): Promise<HistorySummary> {
        return this.historySummaryService.summarize(user.id);
    }

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

    @Delete('me/data')
    @HttpCode(204)
    async removeUserData(@CurrentUser() user: User): Promise<void> {
        await this.userService.removeData(user.id)
    }
}
