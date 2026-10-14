import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { AuthService } from './auth.service.js';
import { CreateUserDto, LoginDto } from '../user/dto/user.dto.js';
import { User } from '../user/user.entity.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register')
    register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @HttpCode(200)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    me(@CurrentUser() user: User) {
        return { id: user.id, username: user.username, email: user.email}
    }
}
