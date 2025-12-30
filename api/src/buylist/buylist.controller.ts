import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { BuylistService } from './buylist.service';
import { CreateBuylistRuleDto, CreateBuylistOfferDto, UpdateOfferStatusDto } from './dto/buylist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/dto/auth.dto';

@Controller('buylist')
export class BuylistController {
    constructor(private readonly buylistService: BuylistService) { }

    // --- Admin Routes (JWT) ---

    @Post('rules')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    createRule(@Request() req, @Body() dto: CreateBuylistRuleDto) {
        return this.buylistService.createRule(req.user.storeId, dto);
    }

    @Get('rules')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getRules(@Request() req) {
        return this.buylistService.getRules(req.user.storeId);
    }

    @Get('offers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getOffers(@Request() req) {
        return this.buylistService.getOffers(req.user.storeId);
    }

    @Patch('offers/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    updateOffer(@Request() req, @Param('id') id: string, @Body() dto: UpdateOfferStatusDto) {
        return this.buylistService.updateOfferStatus(req.user.storeId, id, dto);
    }

    // --- Public Routes (API Key) ---

    @Post('offers')
    @UseGuards(ApiKeyGuard)
    submitOffer(@Request() req, @Body() dto: CreateBuylistOfferDto) {
        // ApiKeyGuard attaches 'store' to req
        return this.buylistService.submitOffer(req.store.id, dto);
    }
}
