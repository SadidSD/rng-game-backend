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

    calculateCardBuylistPrice(product: any, rules: any[]) {
        if (!product.price) {
            return { cashPrice: 0, creditPrice: 0 };
        }
        const retailPrice = Number(product.price);

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
        // Read from BuylistFeaturedCard — completely separate from the shop's Product table
        const featuredCards = await this.prisma.buylistFeaturedCard.findMany({
            where: { storeId },
            orderBy: { createdAt: 'asc' },
            take: 300,
        });

        const rules = await this.prisma.buylistRule.findMany({ where: { storeId } });

        return featuredCards.map(fc => {
            const pricing = this.calculateCardBuylistPrice({
                price: fc.basePrice ? Number(fc.basePrice) : 0,
                game: fc.game,
                set: fc.set,
                rarity: null,
            }, rules);
            return {
                id: fc.id,
                name: fc.name,
                set: fc.set || 'Unknown Set',
                game: fc.game,
                image: fc.image,
                basePrice: fc.basePrice ? Number(fc.basePrice) : pricing.cashPrice,
            };
        });
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

        const rules = await this.prisma.buylistRule.findMany({ where: { storeId } });

        const mappedLocal = localResults.map(p => {
            const pricing = this.calculateCardBuylistPrice(p, rules);
            return {
                id: p.id,
                name: p.name,
                set: p.set || 'Unknown Set',
                game: p.game || 'TCG',
                image: p.images[0] || '',
                basePrice: pricing.cashPrice
            };
        });

        // Search Scryfall remote cards
        const remoteResults = await this.scryfallService.searchCards(query);
        const mappedRemote = remoteResults.map(card => {
            const pricing = this.calculateCardBuylistPrice({
                price: card.price,
                game: 'MTG',
                set: card.set,
                rarity: card.rarity
            }, rules);

            return {
                id: card.id,
                name: card.name,
                set: card.set || 'Unknown Set',
                game: 'MTG',
                image: card.image || '',
                basePrice: pricing.cashPrice,
                isRemote: true
            };
        });

        return {
            source: 'hybrid',
            local: mappedLocal,
            remote: mappedRemote
        };
    }

    async searchBuylistBulk(storeId: string, cards: { name: string, set?: string }[]) {
        const results: any[] = [];
        const rules = await this.prisma.buylistRule.findMany({ where: { storeId } });

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
                const pricing = this.calculateCardBuylistPrice(bestProduct, rules);

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
                    const pricing = this.calculateCardBuylistPrice({
                        price: sCard.price,
                        game: 'MTG',
                        set: sCard.set,
                        rarity: sCard.rarity
                    }, rules);

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
                        const gameCode = (product.game || 'MTG').toUpperCase().substring(0, 3);
                        const setCode = (product.set || 'UNK').toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const collector = (product.collectorNumber || '000').padStart(3, '0').replace(/[^A-Z0-9]/g, '');
                        const slug = product.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 25);
                        const condCode = mappedCond === 'DAMAGED' ? 'DMG' : mappedCond;
                        const finishCode = item.isFoil ? 'F' : 'NF';
                        const generatedSku = `${gameCode}-${setCode}-${collector}-${slug}-${condCode}-EN-${finishCode}`;

                        variant = await this.prisma.productVariant.create({
                            data: {
                                productId: product.id,
                                sku: generatedSku,
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
        let customer = await this.prisma.customer.findFirst({
            where: { storeId, email: offer.customerEmail }
        });

        if (!customer) {
            console.log(`[Buylist] Customer record not found for email ${offer.customerEmail}. Auto-creating customer profile.`);
            const nameParts = (offer.customerName || '').trim().split(/\s+/);
            const firstName = nameParts[0] || 'Guest';
            const lastName = nameParts.slice(1).join(' ') || 'Customer';

            customer = await this.prisma.customer.create({
                data: {
                    storeId,
                    email: offer.customerEmail,
                    firstName,
                    lastName,
                    creditBalance: 0
                }
            });
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

    async runRetroactiveBackfill() {
        const completedOffers = await this.prisma.buylistOffer.findMany({
            where: { status: 'COMPLETED' }
        });

        const logs: string[] = [];
        logs.push(`Found ${completedOffers.length} completed buylist offers in database.`);

        for (const offer of completedOffers) {
            logs.push(`Processing offer ID: ${offer.id} for ${offer.customerEmail} (Credit: $${offer.totalCredit})`);

            // Find or create Customer
            let customer = await this.prisma.customer.findFirst({
                where: { email: offer.customerEmail, storeId: offer.storeId }
            });

            if (!customer) {
                logs.push(`Customer profile missing for email: ${offer.customerEmail}. Creating now...`);
                const nameParts = (offer.customerName || '').trim().split(/\s+/);
                const firstName = nameParts[0] || 'Guest';
                const lastName = nameParts.slice(1).join(' ') || 'Customer';

                customer = await this.prisma.customer.create({
                    data: {
                        storeId: offer.storeId,
                        email: offer.customerEmail,
                        firstName,
                        lastName,
                        creditBalance: 0
                    }
                });
                logs.push(`Created Customer profile: ID=${customer.id}`);
            } else {
                logs.push(`Customer profile already exists: ID=${customer.id}, current balance: $${customer.creditBalance}`);
            }

            // Award the credit only if balance is currently 0 to prevent double-crediting
            if (Number(customer.creditBalance) === 0) {
                logs.push(`Incrementing credit balance by $${offer.totalCredit}...`);
                const updatedCustomer = await this.prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        creditBalance: {
                            increment: offer.totalCredit
                        }
                    }
                });
                logs.push(`Updated Customer: ID=${updatedCustomer.id}, New Balance=$${updatedCustomer.creditBalance}`);
            } else {
                logs.push(`Customer already has non-zero balance ($${customer.creditBalance}). Skipping increment to prevent double-crediting.`);
            }
        }

        return {
            message: "Backfill complete!",
            logs
        };
    }
}
