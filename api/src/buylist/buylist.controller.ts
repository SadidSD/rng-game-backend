import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
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
        console.log(`[Buylist] Fetching Offers. User: ${req.user.email}, Role: ${req.user.role}, Store ID: ${req.user.storeId}`);
        return this.buylistService.getOffers(req.user.storeId);
    }

    @Get('offers/me')
    @UseGuards(JwtAuthGuard)
    getMyOffers(@Request() req) {
        return this.buylistService.findMyOffers(req.user.userId);
    }

    @Get('offers/:id/images')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.STAFF)
    getOfferImages(@Request() req, @Param('id') id: string) {
        return this.buylistService.getOfferImages(req.user.storeId, id);
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
        console.log(`[Buylist] Submitting Offer. Store ID: ${req.store.id}`);
        return this.buylistService.submitOffer(req.store.id, dto);
    }



    @Get('featured')
    @UseGuards(ApiKeyGuard)
    getFeaturedCards(@Request() req) {
        return this.buylistService.getFeaturedCards(req.store.id);
    }

    @Get('search')
    @UseGuards(ApiKeyGuard)
    search(@Request() req, @Query('query') query: string) {
        return this.buylistService.searchBuylist(req.store.id, query || '');
    }
}
