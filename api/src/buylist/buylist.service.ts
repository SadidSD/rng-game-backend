import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuylistRuleDto, CreateBuylistOfferDto, UpdateOfferStatusDto } from './dto/buylist.dto';

@Injectable()
export class BuylistService {
    constructor(private prisma: PrismaService) { }

    async createRule(storeId: string, dto: CreateBuylistRuleDto) {
        return this.prisma.buylistRule.create({
            data: {
                ...dto,
                storeId,
            },
        });
    }

    async getRules(storeId: string) {
        return this.prisma.buylistRule.findMany({
            where: { storeId }
        });
    }

    async submitOffer(storeId: string, dto: CreateBuylistOfferDto) {
        // Calculate totals
        let totalCash = 0;
        let totalCredit = 0;

        // Simplified: Cash and Credit same for now, or apply logic
        dto.items.forEach(item => {
            totalCash += item.offerPrice * item.quantity;
            totalCredit += (item.offerPrice * 1.25) * item.quantity; // 25% bonus for credit example
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

    async getOffers(storeId: string) {
        return this.prisma.buylistOffer.findMany({
            where: { storeId },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateOfferStatus(storeId: string, offerId: string, dto: UpdateOfferStatusDto) {
        const offer = await this.prisma.buylistOffer.findUnique({
            where: { id: offerId }
        });

        if (!offer || offer.storeId !== storeId) {
            throw new NotFoundException('Offer not found');
        }

        return this.prisma.buylistOffer.update({
            where: { id: offerId },
            data: { status: dto.status }
        });
    }
}
