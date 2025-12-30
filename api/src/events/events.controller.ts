import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, RegisterPlayerDto } from './dto/events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    // --- Admin ---
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    create(@Request() req, @Body() dto: CreateEventDto) {
        return this.eventsService.create(req.user.storeId, dto);
    }

    // --- Public (Storefront) ---
    @Get()
    @UseGuards(ApiKeyGuard)
    findAll(@Request() req) {
        return this.eventsService.findAll(req.store.id);
    }

    @Post(':id/register')
    @UseGuards(ApiKeyGuard)
    register(@Request() req, @Param('id') id: string, @Body() dto: RegisterPlayerDto) {
        return this.eventsService.registerPlayer(req.store.id, id, dto);
    }
}
