import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Post('track')
    trackPayload(@Body() body: any) {
        return this.analyticsService.trackPayload(body);
    }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getDashboard(@Request() req) {
        return this.analyticsService.getDashboardStats(req.user.storeId);
    }

    @Get('advanced')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getAdvanced(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('game') game?: string,
        @Query('category') category?: string
    ) {
        return this.analyticsService.getAdvancedStats(req.user.storeId, startDate, endDate, game, category);
    }

    @Get('traffic')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getTraffic(
        @Request() req,
        @Query('days') days?: string
    ) {
        const parsedDays = days ? parseInt(days, 10) : 7;
        return this.analyticsService.getTrafficStats(req.user.storeId, isNaN(parsedDays) ? 7 : parsedDays);
    }
}
