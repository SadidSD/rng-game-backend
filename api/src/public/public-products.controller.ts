import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicProductsController {
    constructor(private prisma: PrismaService) { }

    @Get('products')
    async getProducts(@Request() req) {
        try {
            const storeId = req.store.id;
            const query = { ...(req.query || {}) };
            const andConditions: any[] = [{ storeId }];

            // --- Layer 1: Global Identity ---
            if (query.name) {
                andConditions.push({ name: { contains: String(query.name), mode: 'insensitive' } });
            }

            // --- Layer 2: Categories (Multi-value support) ---
            if (query.category) {
                const values = String(query.category).split(',').map(v => v.trim()).filter(Boolean);
                if (values.length > 0) {
                    const categoryConditions = values.flatMap(val => {
                        const filters: any[] = [
                            { category: { name: { equals: val, mode: 'insensitive' } } },
                            { category: { slug: { equals: val, mode: 'insensitive' } } }
                        ];
                        if (val.length === 36 && val.includes('-')) {
                            filters.push({ categoryId: val });
                        }
                        return filters;
                    });
                    andConditions.push({ OR: categoryConditions });
                }
            }

            // --- Layer 3: Game (Multi-value support) ---
            if (query.game) {
                const games = String(query.game).split(',').map(g => g.trim()).filter(Boolean);
                if (games.length > 0) {
                    andConditions.push({
                        OR: games.map(game => ({
                            game: { equals: game, mode: 'insensitive' }
                        }))
                    });
                }
            }

            // --- Layer 4: Card Meta (Oracle) ---
            const cardWhere: any = {};
            let hasCardFilters = false;

            if (query.colors) {
                cardWhere.colorIdentity = { hasSome: String(query.colors).split(',').map(c => c.trim()).filter(Boolean) };
                hasCardFilters = true;
            }

            if (query.oracle) {
                cardWhere.oracleText = { contains: String(query.oracle), mode: 'insensitive' };
                hasCardFilters = true;
            }

            if (query.type) {
                cardWhere.typeLine = { contains: String(query.type), mode: 'insensitive' };
                hasCardFilters = true;
            }

            if (query.cmcMin || query.cmcMax) {
                const manaValue: any = {};
                if (query.cmcMin) manaValue.gte = parseFloat(String(query.cmcMin));
                if (query.cmcMax) manaValue.lte = parseFloat(String(query.cmcMax));
                cardWhere.manaValue = manaValue;
                hasCardFilters = true;
            }

            if (query.format) {
                const formatStr = String(query.format).toLowerCase();
                cardWhere.legalities = {
                    path: [formatStr],
                    equals: 'legal'
                };
                hasCardFilters = true;
            }

            if (hasCardFilters) {
                andConditions.push({ card: cardWhere });
            }

            // --- Layer 5: Set & Rarity ---
            if (query.set) {
                andConditions.push({ set: { contains: String(query.set), mode: 'insensitive' } });
            }

            if (query.rarity) {
                andConditions.push({ rarity: { equals: String(query.rarity), mode: 'insensitive' } });
            }

            if (query.tag) {
                const tags = String(query.tag).split(',').map(t => t.trim()).filter(Boolean);
                if (tags.length > 0) {
                    andConditions.push({ tags: { hasSome: tags } });
                }
            }

            // --- Layer 7: Singles — exclude known sealed/supply categories ---
            if (query.singles === 'true') {
                const SEALED_SLUGS = [
                    'booster-boxes', 'booster-packs', 'bundles', 'precon-decks',
                    'collector-s-editions', 'starter-kits', 'sealed', 'supplies', 'accessories',
                ];
                const SEALED_NAMES = [
                    'Booster Boxes', 'Booster Packs', 'Bundles', 'Precon Decks',
                    "Collector's Editions", 'Starter Kits', 'Sealed Products', 'Supplies', 'Accessories',
                ];
                andConditions.push({
                    NOT: {
                        OR: [
                            { category: { slug: { in: SEALED_SLUGS } } },
                            { category: { name: { in: SEALED_NAMES } } },
                        ]
                    }
                });
            }

            // --- Layer 6: Variants & Price ---
            const variantWhere: any = {};
            let hasVariantFilters = false;

            if (query.priceMin || query.priceMax) {
                const price: any = {};
                if (query.priceMin) price.gte = parseFloat(String(query.priceMin));
                if (query.priceMax) price.lte = parseFloat(String(query.priceMax));
                variantWhere.price = price;
                hasVariantFilters = true;
            }

            if (query.foil) {
                variantWhere.isFoil = String(query.foil) === 'true';
                hasVariantFilters = true;
            }

            if (query.inStock === 'true') {
                variantWhere.inventory = { quantity: { gt: 0 } };
                hasVariantFilters = true;
            }

            if (hasVariantFilters) {
                andConditions.push({ variants: { some: variantWhere } });
            }

            // --- Ordering ---
            let orderBy: any = { createdAt: 'desc' };
            if (query.sort === 'name_asc') orderBy = { name: 'asc' };
            else if (query.sort === 'price_asc') orderBy = { price: 'asc' };
            else if (query.sort === 'price_desc') orderBy = { price: 'desc' };
            else if (query.sort === 'created_desc') orderBy = { createdAt: 'desc' };
            else if (query.sort === 'bestselling') orderBy = { createdAt: 'desc' }; // Fallback
            else if (query.sort === 'trending') orderBy = { updatedAt: 'desc' }; // Fallback

            const safeConditions = JSON.parse(JSON.stringify(andConditions));

            const products = await this.prisma.product.findMany({
                where: { AND: safeConditions },
                include: {
                    variants: { include: { inventory: true } },
                    card: true,
                    category: true
                },
                orderBy,
                take: 100
            });

            const safeData = JSON.parse(JSON.stringify(products));

            return {
                store: req.store.name,
                count: products.length,
                data: safeData
            };
        } catch (error: any) {
            console.error('API_ERROR TRAPPED:', error);
            require('fs').writeFileSync('CRASH_LOG.txt', error instanceof Error ? error.stack : String(error));
            return {
                statusCode: 500,
                message: error instanceof Error ? error.stack : String(error)
            };
        }
    }

    @Get('products/bestsellers')
    async getBestsellers(@Request() req) {
        try {
            const storeId = req.store.id;
            const take = Math.min(parseInt(String(req.query?.take ?? '12')), 50);

            // Aggregate OrderItems by variantId to find most sold
            const topItems = await this.prisma.orderItem.groupBy({
                by: ['variantId'],
                where: {
                    order: { storeId, paymentStatus: 'PAID' },
                    variantId: { not: null },
                },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: take * 3, // over-fetch to account for deleted variants
            });

            // Resolve variantIds → products
            const variantIds = topItems.map(i => i.variantId).filter(Boolean) as string[];

            if (variantIds.length === 0) {
                // Fallback: return newest products if no sales data yet
                const fallback = await this.prisma.product.findMany({
                    where: { storeId },
                    include: { variants: { include: { inventory: true } }, card: true, category: true },
                    orderBy: { createdAt: 'desc' },
                    take,
                });
                return { store: req.store.name, count: fallback.length, data: JSON.parse(JSON.stringify(fallback)) };
            }

            const variants = await this.prisma.productVariant.findMany({
                where: { id: { in: variantIds } },
                include: {
                    product: {
                        include: { variants: { include: { inventory: true } }, card: true, category: true }
                    }
                },
            });

            // Deduplicate by productId, preserving rank order
            const seenProducts = new Set<string>();
            const rankedProducts: any[] = [];
            for (const aggItem of topItems) {
                const variant = variants.find(v => v.id === aggItem.variantId);
                if (!variant) continue;
                const pid = variant.product.id;
                if (seenProducts.has(pid)) continue;
                seenProducts.add(pid);
                rankedProducts.push({ ...variant.product, _soldCount: aggItem._sum.quantity ?? 0 });
                if (rankedProducts.length >= take) break;
            }

            return {
                store: req.store.name,
                count: rankedProducts.length,
                data: JSON.parse(JSON.stringify(rankedProducts)),
            };
        } catch (error: any) {
            console.error('API_ERROR_BESTSELLERS:', error);
            return { statusCode: 500, message: error?.message ?? 'Unknown error' };
        }
    }

    @Get('products/sets/counts')
    async getSetCounts(@Request() req) {
        try {
            const storeId = req.store.id;

            const results = await this.prisma.product.groupBy({
                by: ['set'],
                where: {
                    storeId,
                    set: { not: null },
                },
                _count: { id: true },
            });

            const counts: Record<string, number> = {};
            for (const row of results) {
                if (row.set) {
                    counts[row.set] = row._count.id;
                }
            }

            return counts;
        } catch (error) {
            console.error('API_ERROR_SET_COUNTS:', error);
            return {};
        }
    }

    @Get('products/:id')
    async getProduct(@Request() req, @Param('id') id: string) {
        try {
            const product = await this.prisma.product.findFirst({
                where: { id, storeId: req.store.id },
                include: {
                    variants: { include: { inventory: true } },
                    card: true,
                    category: true
                }
            });
            return product;
        } catch (error) {
            console.error('API_ERROR_ID:', error);
            throw error;
        }
    }
}
