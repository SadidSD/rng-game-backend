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
        const products = await this.prisma.product.findMany({
            where: { 
                storeId,
                cardId: { not: null }
            },
            take: 50,
            orderBy: { createdAt: 'desc' }
        });

        return products.map(p => ({
            id: p.id,
            name: p.name,
            set: p.set || 'Unknown Set',
            game: p.game || 'TCG',
            image: p.images[0] || '',
            basePrice: p.price ? Number(p.price) * 0.5 : 0 // Mock buy price at 50% of retail
        }));
    }

    async searchBuylist(storeId: string, query: string) {
        // 1. Search Local Products (Singles only)
        const localResults = await this.prisma.product.findMany({
            where: {
                storeId,
                cardId: { not: null },
                name: { contains: query, mode: 'insensitive' }
            },
            take: 20
        });

        const mappedLocal = localResults.map(p => ({
            id: p.id,
            name: p.name,
            set: p.set || 'Unknown Set',
            game: p.game || 'TCG',
            image: p.images[0] || '',
            basePrice: p.price ? Number(p.price) * 0.5 : 0 // Mock buy price at 50% of retail
        }));

        // 2. Search Remote (Pokemon TCG) if local results are insufficient (e.g. < 5) OR always?
        // Returning local for now, will add remote in next step after wiring Module.

        return {
            source: 'hybrid',
            local: mappedLocal,
            remote: [] // Placeholder
        };
    }

    async searchBuylistBulk(storeId: string, cards: { name: string, set?: string }[]) {
        const results: any[] = [];

        for (const item of cards) {
            if (!item.name || !item.name.trim()) continue;

            const matchedProducts = await this.prisma.product.findMany({
                where: {
                    storeId,
                    cardId: { not: null },
                    name: { contains: item.name, mode: 'insensitive' },
                    ...(item.set ? { set: { contains: item.set, mode: 'insensitive' } } : {})
                },
                take: 5
            });

            if (matchedProducts.length > 0) {
                // Prioritize exact match, then closest length match
                matchedProducts.sort((a, b) => {
                    const aExact = a.name.toLowerCase() === item.name.toLowerCase();
                    const bExact = b.name.toLowerCase() === item.name.toLowerCase();
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    return Math.abs(a.name.length - item.name.length) - Math.abs(b.name.length - item.name.length);
                });

                const bestProduct = matchedProducts[0];
                results.push({
                    cardName: item.name,
                    matchedCard: {
                        id: bestProduct.id,
                        name: bestProduct.name,
                        set: bestProduct.set || 'Unknown Set',
                        game: bestProduct.game || 'TCG',
                        image: bestProduct.images[0] || '',
                        cashPrice: bestProduct.price ? Number(bestProduct.price) * 0.5 : 0,
                        creditPrice: bestProduct.price ? Number(bestProduct.price) * 0.65 : 0
                    },
                    confidence: bestProduct.name.toLowerCase() === item.name.toLowerCase() ? 1.0 : 0.8
                });
            } else {
                results.push({
                    cardName: item.name,
                    matchedCard: null,
                    confidence: 0
                });
            }
        }

        return results;
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
                        quantity: item.quantity,
                        imageUrl: item.imageUrl,
                        setName: item.setName
                    }))
                },
                images: dto.images && dto.images.length > 0 ? {
                    create: dto.images.map(base64 => ({ base64 }))
                } : undefined
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

        // Delete images when offer is finalized to save space
        if (dto.status === 'COMPLETED' || dto.status === 'REJECTED' || dto.status === 'CANCELLED') {
            await this.prisma.buylistOfferImage.deleteMany({
                where: { offerId }
            });
        }

        return updated;
    }

    async getOfferImages(storeId: string, offerId: string) {
        const offer = await this.prisma.buylistOffer.findUnique({
            where: { id: offerId, storeId }
        });
        if (!offer) throw new NotFoundException('Offer not found');

        return this.prisma.buylistOfferImage.findMany({
            where: { offerId },
            select: { id: true, base64: true }
        });
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

    async findMyOffers(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.buylistOffer.findMany({
            where: { storeId: user.storeId, customerEmail: user.email },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
