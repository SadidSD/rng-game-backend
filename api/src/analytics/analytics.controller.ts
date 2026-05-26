import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF) // Staff can see stats? Yes.
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    getDashboard(@Request() req) {
        return this.analyticsService.getDashboardStats(req.user.storeId);
    }

    @Get('advanced')
    getAdvanced(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.analyticsService.getAdvancedStats(req.user.storeId, startDate, endDate);
    }
}
