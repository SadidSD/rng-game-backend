import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, FulfillOrderDto, UpdateOrderItemsDto } from './dto/orders.dto';
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

    @Get(':id/rates')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getEasyPostRates(@Request() req, @Param('id') id: string) {
        return this.ordersService.getEasyPostRates(req.user.storeId, id);
    }

    @Post(':id/fulfill')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    fulfillOrder(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: FulfillOrderDto
    ) {
        return this.ordersService.fulfillOrder(
            req.user.storeId,
            id,
            dto.easypostRateId,
            dto.easypostShipmentId
        );
    }

    // --- Customer Routes (JWT) ---
    @Get('me')
    @UseGuards(JwtAuthGuard)
    findMyOrders(@Request() req) {
        return this.ordersService.findMyOrders(req.user.userId);
    }

    @Get('customer/:id')
    @UseGuards(JwtAuthGuard)
    findCustomerOrder(@Request() req, @Param('id') id: string) {
        return this.ordersService.findCustomerOrder(req.user.userId, id);
    }

    @Get('pull-list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getPullList(@Request() req, @Query('ids') ids: string) {
        const orderIds = ids ? ids.split(',') : [];
        return this.ordersService.getPullList(req.user.storeId, orderIds);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    findOne(@Request() req, @Param('id') id: string) {
        return this.ordersService.findOne(req.user.storeId, id);
    }

    @Patch(':id/items')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    updateOrderItems(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdateOrderItemsDto
    ) {
        return this.ordersService.updateOrderItems(req.user.storeId, id, dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    updateStatus(@Request() req, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(req.user.storeId, id, dto);
    }
}
