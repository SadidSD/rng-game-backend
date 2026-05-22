import { Controller, Post, Body, Get, Patch, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, Role } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    signup(@Body() dto: SignupDto) {
        // Keep this for admin/internal use if needed, or deprecate
        return this.authService.signup(dto);
    }

    @Post('register')
    register(@Body() dto: SignupDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('debug')
    debug(@Request() req) {
        // Usage: /api/auth/debug?email=admin@tcg.com&password=password123
        const email = req.query.email;
        const password = req.query.password;

        return this.authService.debugLogin(email, password);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    async changePassword(@Request() req, @Body() body: { currentPassword: string, newPassword: string }) {
        return this.authService.changePassword(req.user.sub, { oldPassword: body.currentPassword, newPassword: body.newPassword });
    }
}
