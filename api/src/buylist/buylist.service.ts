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

    async getFeaturedCards(storeId: string) {
        return this.prisma.buylistFeaturedCard.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async searchBuylist(storeId: string, query: string) {
        // 1. Search Local "Featured" Cards
        const localResults = await this.prisma.buylistFeaturedCard.findMany({
            where: {
                storeId,
                name: { contains: query, mode: 'insensitive' }
            }
        });

        // 2. Search Remote (Pokemon TCG) if local results are insufficient (e.g. < 5) OR always?
        // Let's do ALWAYS for now to give broad results, but mark them differently.
        // We need to inject PokemonTcgService. It might not be available yet in this module.
        // Returning local for now, will add remote in next step after wiring Module.

        return {
            source: 'hybrid',
            local: localResults,
            remote: [] // Placeholder
        };
    }

    async submitOffer(storeId: string, dto: CreateBuylistOfferDto) {
        // Calculate totals
        let totalCash = 0;
        let totalCredit = 0;

        // Simplified: Store Credit Only (30% Bonus hardcoded for now, or use rule)
        dto.items.forEach(item => {
            totalCash = 0; // Usage: No Cash Payouts
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

        const updated = await this.prisma.buylistOffer.update({
            where: { id: offerId },
            data: { status: dto.status }
        });

        // Loop: If COMPLETED, issue credit
        if (dto.status === 'COMPLETED') {
            await this.finalizeOfferCredit(storeId, offer);
        }

        return updated;
    }

    // Helper: Issue Store Credit
    async finalizeOfferCredit(storeId: string, offer: any) {
        // 1. Find Customer by Email
        const customer = await this.prisma.customer.findFirst({
            where: { storeId, email: offer.customerEmail }
        });

        if (!customer) {
            // Option: Create Ghost Customer? Or Throw?
            // For now, log warning.
            console.warn(`[Buylist] Could not issue credit. Customer ${offer.customerEmail} not found.`);
            return;
        }

        // 2. Add Credit
        await this.prisma.customer.update({
            where: { id: customer.id },
            data: {
                creditBalance: { increment: offer.totalCredit }
            }
        });

        console.log(`[Buylist] Issued $${offer.totalCredit} credit to ${offer.customerEmail}`);
    }
}
