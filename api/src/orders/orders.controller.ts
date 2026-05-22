import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    // --- Public Checkout (API Key) ---
    @Post()
    @UseGuards(ApiKeyGuard)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 checkouts per minute
    create(@Request() req, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(req.store.id, dto);
    }

    // --- Admin Management (JWT) ---
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    findAll(@Request() req) {
        return this.ordersService.findAll(req.user.storeId);
    }

    // --- Customer Routes (JWT) ---
    @Get('me')
    @UseGuards(JwtAuthGuard)
    findMyOrders(@Request() req) {
        return this.ordersService.findMyOrders(req.user.userId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    findOne(@Request() req, @Param('id') id: string) {
        return this.ordersService.findOne(req.user.storeId, id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    updateStatus(@Request() req, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(req.user.storeId, id, dto);
    }
}
