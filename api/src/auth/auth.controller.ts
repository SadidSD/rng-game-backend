import { Controller, Post, Body, Get, Patch, UseGuards, Request } from '@nestjs/common';
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
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin')
    getAdmin(@Request() req) {
        return { message: 'Admin access granted', user: req.user };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    changePassword(@Request() req, @Body() dto: any) {
        return this.authService.changePassword(req.user.sub, dto);
    }
}
