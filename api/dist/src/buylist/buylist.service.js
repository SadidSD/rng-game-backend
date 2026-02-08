"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuylistService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BuylistService = class BuylistService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRule(storeId, dto) {
        return this.prisma.buylistRule.create({
            data: {
                ...dto,
                storeId,
            },
        });
    }
    async getRules(storeId) {
        return this.prisma.buylistRule.findMany({
            where: { storeId }
        });
    }
    async getFeaturedCards(storeId) {
        return this.prisma.buylistFeaturedCard.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async searchBuylist(storeId, query) {
        const localResults = await this.prisma.buylistFeaturedCard.findMany({
            where: {
                storeId,
                name: { contains: query, mode: 'insensitive' }
            }
        });
        return {
            source: 'hybrid',
            local: localResults,
            remote: []
        };
    }
    async submitOffer(storeId, dto) {
        let totalCash = 0;
        let totalCredit = 0;
        dto.items.forEach(item => {
            totalCash = 0;
            totalCredit += item.offerPrice * item.quantity;
        });
        return this.prisma.buylistOffer.create({
            data: {
                storeId,
                customerName: dto.customerName,
                customerEmail: dto.customerEmail,
                totalCash,
                totalCredit,
                items: {
                    create: dto.items.map(item => ({
                        cardName: item.cardName,
                        condition: item.condition,
                        isFoil: item.isFoil,
                        offerPrice: item.offerPrice,
                        quantity: item.quantity
                    }))
                }
            },
            include: { items: true }
        });
    }
    async getOffers(storeId) {
        return this.prisma.buylistOffer.findMany({
            where: { storeId },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateOfferStatus(storeId, offerId, dto) {
        const offer = await this.prisma.buylistOffer.findUnique({
            where: { id: offerId }
        });
        if (!offer || offer.storeId !== storeId) {
            throw new common_1.NotFoundException('Offer not found');
        }
        const updated = await this.prisma.buylistOffer.update({
            where: { id: offerId },
            data: { status: dto.status }
        });
        if (dto.status === 'COMPLETED') {
            await this.finalizeOfferCredit(storeId, offer);
        }
        return updated;
    }
    async finalizeOfferCredit(storeId, offer) {
        const customer = await this.prisma.customer.findFirst({
            where: { storeId, email: offer.customerEmail }
        });
        if (!customer) {
            console.warn(`[Buylist] Could not issue credit. Customer ${offer.customerEmail} not found.`);
            return;
        }
        await this.prisma.customer.update({
            where: { id: customer.id },
            data: {
                creditBalance: { increment: offer.totalCredit }
            }
        });
        console.log(`[Buylist] Issued $${offer.totalCredit} credit to ${offer.customerEmail}`);
    }
};
exports.BuylistService = BuylistService;
exports.BuylistService = BuylistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BuylistService);
//# sourceMappingURL=buylist.service.js.map