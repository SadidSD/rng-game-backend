import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuylistRuleDto, CreateBuylistOfferDto, UpdateOfferStatusDto } from './dto/buylist.dto';
import { ScryfallService } from '../integrations/scryfall.service';

@Injectable()
export class BuylistService {
    constructor(
        private prisma: PrismaService,
        private scryfallService: ScryfallService
    ) { }

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

    async deleteRule(storeId: string, ruleId: string) {
        const rule = await this.prisma.buylistRule.findUnique({
            where: { id: ruleId }
        });
        if (!rule || rule.storeId !== storeId) {
            throw new NotFoundException('Rule not found');
        }
        return this.prisma.buylistRule.delete({
            where: { id: ruleId }
        });
    }

    async calculateCardBuylistPrice(storeId: string, product: any) {
        if (!product.price) {
            return { cashPrice: 0, creditPrice: 0 };
        }
        const retailPrice = Number(product.price);

        // Fetch all store rules
        const rules = await this.prisma.buylistRule.findMany({
            where: { storeId }
        });

        // Try to find the most specific matching rule
        let bestRule: any = null;
        let bestScore = 0; // Precedence score

        for (const rule of rules) {
            if (rule.game.toLowerCase() !== (product.game || '').toLowerCase()) {
                continue;
            }

            let score = 1;

            if (rule.set) {
                if (product.set && product.set.toLowerCase() === rule.set.toLowerCase()) {
                    score += 2;
                } else {
                    continue;
                }
            }

            if (rule.rarity) {
                if (product.rarity && product.rarity.toLowerCase() === rule.rarity.toLowerCase()) {
                    score += 1;
                } else {
                    continue;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestRule = rule;
            }
        }

        let cashPercentage = 0.50; // Default cash is 50%
        if (bestRule) {
            cashPercentage = Number(bestRule.buyPercentage) / 100;
        }

        const creditPercentage = cashPercentage * 1.3;

        const cashPrice = retailPrice * cashPercentage;
        const creditPrice = retailPrice * creditPercentage;

        return {
            cashPrice: Number(cashPrice.toFixed(2)),
            creditPrice: Number(creditPrice.toFixed(2))
        };
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

        return Promise.all(products.map(async p => {
            const pricing = await this.calculateCardBuylistPrice(storeId, p);
            return {
                id: p.id,
                name: p.name,
                set: p.set || 'Unknown Set',
                game: p.game || 'TCG',
                image: p.images[0] || '',
                basePrice: pricing.cashPrice
            };
        }));
    }

    async searchBuylist(storeId: string, query: string) {
        const localResults = await this.prisma.product.findMany({
            where: {
                storeId,
                cardId: { not: null },
                name: { contains: query, mode: 'insensitive' }
            },
            take: 20
        });

        const mappedLocal = await Promise.all(localResults.map(async p => {
            const pricing = await this.calculateCardBuylistPrice(storeId, p);
            return {
                id: p.id,
                name: p.name,
                set: p.set || 'Unknown Set',
                game: p.game || 'TCG',
                image: p.images[0] || '',
                basePrice: pricing.cashPrice
            };
        }));

        // Search Scryfall remote cards
        const remoteResults = await this.scryfallService.searchCards(query);
        const mappedRemote = await Promise.all(remoteResults.map(async card => {
            const pricing = await this.calculateCardBuylistPrice(storeId, {
                price: card.price,
                game: 'MTG',
                set: card.set,
                rarity: card.rarity
            });

            return {
                id: card.id,
                name: card.name,
                set: card.set || 'Unknown Set',
                game: 'MTG',
                image: card.image || '',
                basePrice: pricing.cashPrice,
                isRemote: true
            };
        }));

        return {
            source: 'hybrid',
            local: mappedLocal,
            remote: mappedRemote
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
                matchedProducts.sort((a, b) => {
                    const aExact = a.name.toLowerCase() === item.name.toLowerCase();
                    const bExact = b.name.toLowerCase() === item.name.toLowerCase();
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                    return Math.abs(a.name.length - item.name.length) - Math.abs(b.name.length - item.name.length);
                });

                const bestProduct = matchedProducts[0];
                const pricing = await this.calculateCardBuylistPrice(storeId, bestProduct);

                results.push({
                    cardName: item.name,
                    matchedCard: {
                        id: bestProduct.id,
                        name: bestProduct.name,
                        set: bestProduct.set || 'Unknown Set',
                        game: bestProduct.game || 'TCG',
                        image: bestProduct.images[0] || '',
                        cashPrice: pricing.cashPrice,
                        creditPrice: pricing.creditPrice
                    },
                    confidence: bestProduct.name.toLowerCase() === item.name.toLowerCase() ? 1.0 : 0.8
                });
            } else {
                // Not found locally: check Scryfall by card name
                const sCard = await this.scryfallService.searchCardByName(item.name);
                if (sCard) {
                    const pricing = await this.calculateCardBuylistPrice(storeId, {
                        price: sCard.price,
                        game: 'MTG',
                        set: sCard.set,
                        rarity: sCard.rarity
                    });

                    results.push({
                        cardName: item.name,
                        matchedCard: {
                            id: sCard.id,
                            name: sCard.name,
                            set: sCard.set || 'Unknown Set',
                            game: 'MTG',
                            image: sCard.image || '',
                            cashPrice: pricing.cashPrice,
                            creditPrice: pricing.creditPrice,
                            isRemote: true
                        },
                        confidence: sCard.name.toLowerCase() === item.name.toLowerCase() ? 1.0 : 0.8
                    });
                } else {
                    results.push({
                        cardName: item.name,
                        matchedCard: null,
                        confidence: 0
                    });
                }
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

        // Loop: If APPROVED, add items to inventory
        if (dto.status === 'APPROVED') {
            const offerWithItems = await this.prisma.buylistOffer.findUnique({
                where: { id: offerId },
                include: { items: true }
            });
            if (offerWithItems && offerWithItems.items) {
                for (const item of offerWithItems.items) {
                    let product = await this.prisma.product.findFirst({
                        where: {
                            storeId,
                            name: item.cardName,
                            set: item.setName || undefined
                        }
                    });

                    if (!product) {
                        product = await this.prisma.product.findFirst({
                            where: {
                                storeId,
                                name: item.cardName
                            }
                        });
                    }

                    if (!product) {
                        // Check if the card can be imported from Scryfall
                        const sCard = await this.scryfallService.searchCardByName(item.cardName);
                        if (sCard) {
                            let slug = `${sCard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(sCard.setId || 'set').toLowerCase()}`;
                            const existingSlug = await this.prisma.product.findFirst({
                                where: { storeId, slug }
                            });
                            if (existingSlug) {
                                slug += `-${Math.random().toString(36).substring(2, 6)}`;
                            }

                            // Fetch category (or create MTG category if missing)
                            let category = await this.prisma.category.findFirst({
                                where: { storeId, name: 'Magic: The Gathering' }
                            });
                            if (!category) {
                                let catSlug = 'magic-the-gathering';
                                const existingCat = await this.prisma.category.findFirst({
                                    where: { storeId, slug: catSlug }
                                });
                                if (existingCat) {
                                    catSlug += `-${Math.random().toString(36).substring(2, 6)}`;
                                }
                                category = await this.prisma.category.create({
                                    data: {
                                        storeId,
                                        name: 'Magic: The Gathering',
                                        slug: catSlug
                                    }
                                });
                            }

                            product = await this.prisma.product.create({
                                data: {
                                    storeId,
                                    name: sCard.name,
                                    description: sCard.oracleText || `Scryfall imported card: ${sCard.name}`,
                                    price: Number(sCard.price) || 0.99,
                                    game: 'MTG',
                                    set: sCard.set,
                                    rarity: sCard.rarity,
                                    collectorNumber: sCard.collectorNumber,
                                    categoryId: category.id,
                                    slug,
                                    images: [sCard.image].filter(Boolean),
                                }
                            });
                            console.log(`[Buylist] Dynamic auto-import completed for: ${product.name} (Set: ${product.set})`);
                        }
                    }

                    if (!product) {
                        console.warn(`[Buylist] Product not found in catalog for card: ${item.cardName} (${item.setName})`);
                        continue;
                    }

                    const mapConditionToEnum = (cond: string): 'NM' | 'LP' | 'MP' | 'HP' | 'DAMAGED' => {
                        const clean = cond.trim().toLowerCase();
                        if (clean === 'near mint' || clean === 'nm') return 'NM';
                        if (clean === 'lightly played' || clean === 'lp') return 'LP';
                        if (clean === 'moderately played' || clean === 'mp') return 'MP';
                        if (clean === 'heavily played' || clean === 'hp') return 'HP';
                        return 'DAMAGED';
                    };
                    const mappedCond = mapConditionToEnum(item.condition);

                    let variant = await this.prisma.productVariant.findFirst({
                        where: {
                            productId: product.id,
                            condition: mappedCond,
                            isFoil: item.isFoil
                        }
                    });

                    if (!variant) {
                        variant = await this.prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                sku: `SKU-${product.id}-${mappedCond}-${item.isFoil ? 'FOIL' : 'NONFOIL'}`,
                                condition: mappedCond,
                                isFoil: item.isFoil,
                                price: product.price || 0.99,
                                storeId
                            }
                        });
                    }

                    await this.prisma.inventoryItem.upsert({
                        where: { variantId: variant.id },
                        update: {
                            quantity: { increment: item.quantity }
                        },
                        create: {
                            variantId: variant.id,
                            quantity: item.quantity,
                            storeId
                        }
                    });

                    console.log(`[Buylist] Inventory updated for ${product.name} (${mappedCond}): +${item.quantity}`);
                }
            }
        }

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
