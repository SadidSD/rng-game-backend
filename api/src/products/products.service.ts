import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Condition } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    // Helper: Generate SKU
    // Format: GAME-SET-COLLECTOR-SLUG-COND-LANG-FINISH
    private generateSku(
        game: string,
        set: string,
        collectorNumber: string,
        name: string,
        condition: Condition,
        language: string,
        isFoil: boolean
    ): string {
        const gameCode = (game || 'MTG').toUpperCase().substring(0, 3);
        const setCode = (set || 'UNK').toUpperCase().replace(/ /g, '');
        const collector = (collectorNumber || '000').padStart(3, '0');

        // Slugify Name: UPPERCASE, Remove Spaces/SpecialChars
        const slug = name.toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 25); // Cap length

        const condMap: Record<string, string> = {
            'NM': 'NM',
            'LP': 'LP',
            'MP': 'MP',
            'HP': 'HP',
            'DAMAGED': 'DMG',
            'SEALED': 'SEALED'
        };
        const condCode = condMap[condition] || condition;

        const langCode = (language || 'EN').toUpperCase().substring(0, 2);

        // Finish: NF (Non-foil), F (Foil), EF (Etched - logical handling needs more data, defaulting to F if foil)
        const finishCode = isFoil ? 'F' : 'NF';

        return `${gameCode}-${setCode}-${collector}-${slug}-${condCode}-${langCode}-${finishCode}`;
    }

    async create(storeId: string, dto: CreateProductDto) {
        // Generate a simple slug
        const slug = dto.name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

        return this.prisma.$transaction(async (tx) => {
            try {
                let cardId: string | null = null;

                // 1. Handle Card Identity (Oracle) - GLOBAL
                if (dto.oracleId) {
                    const card = await tx.card.upsert({
                        where: { oracleId: dto.oracleId },
                        update: {
                            legalities: dto.legalities,
                            manaCost: dto.manaCost,
                            manaValue: dto.manaValue,
                            colors: dto.colors,
                            colorIdentity: dto.colorIdentity,
                            typeLine: dto.typeLine,
                            supertypes: dto.supertypes,
                            subtypes: dto.subtypes,
                            power: dto.power,
                            toughness: dto.toughness,
                            loyalty: dto.loyalty,
                            oracleText: dto.oracleText || ''
                        },
                        create: {
                            oracleId: dto.oracleId,
                            name: dto.name,
                            oracleText: dto.oracleText || '',
                            legalities: dto.legalities,
                            manaCost: dto.manaCost,
                            manaValue: dto.manaValue,
                            colors: dto.colors,
                            colorIdentity: dto.colorIdentity,
                            typeLine: dto.typeLine,
                            supertypes: dto.supertypes,
                            subtypes: dto.subtypes,
                            power: dto.power,
                            toughness: dto.toughness,
                            loyalty: dto.loyalty
                        }
                    });
                    cardId = card.id;
                }

                // 2. Validate Category exists for this store
                if (dto.categoryId) {
                    const category = await tx.category.findFirst({
                        where: { id: dto.categoryId, storeId }
                    });
                    if (!category) {
                        throw new Error(`Category ${dto.categoryId} not found for this store.`);
                    }
                }

                // 3. Create Product (Printing)
                return await tx.product.create({
                    data: {
                        name: dto.name,
                        description: dto.description,
                        game: dto.game,
                        categoryId: dto.categoryId || null,
                        set: dto.set,
                        rarity: dto.rarity,
                        collectorNumber: dto.collectorNumber,
                        cardId: cardId,
                        price: dto.price,
                        slug: slug,
                        images: dto.images || [],
                        storeId,
                        variants: {
                            create: dto.variants?.map(v => {
                                const sku = this.generateSku(
                                    dto.game || 'MTG',
                                    dto.set || 'UNK',
                                    dto.collectorNumber || '000',
                                    dto.name,
                                    v.condition,
                                    v.language || 'English',
                                    v.isFoil || false
                                );
                                return {
                                    sku: sku,
                                    condition: v.condition,
                                    isFoil: v.isFoil || false,
                                    language: v.language || 'English',
                                    price: v.price,
                                    costPrice: v.costPrice || null,
                                    storeId,
                                    inventory: {
                                        create: {
                                            quantity: v.quantity,
                                            storeId
                                        }
                                    }
                                };
                            }),
                        },
                    },
                    include: {
                        variants: {
                            include: { inventory: true }
                        },
                        card: true
                    },
                });
            } catch (error) {
                console.error(' [ProductsService] Transaction Failed:', error);
                throw error;
            }
        }, { timeout: 30000 });



    }

    async findAll(storeId: string, query: { game?: string; search?: string }) {
        const where: any = { storeId };

        if (query.game) {
            where.game = query.game;
        }
        if (query.search) {
            where.name = { contains: query.search, mode: 'insensitive' };
        }

        const products = await this.prisma.product.findMany({
            where,
            include: {
                variants: {
                    include: { inventory: true }
                },
                category: true
            },
            orderBy: { createdAt: 'desc' },
        });

        // 2. Calculate Total Sales (Aggregation)
        // Gather all variant IDs
        const variantIds = products.flatMap(p => p.variants.map(v => v.id));

        // Group OrderItems by variantId and sum quantity, filter by valid Order Status
        const salesAgg = await this.prisma.orderItem.groupBy({
            by: ['variantId'],
            _sum: {
                quantity: true
            },
            where: {
                variantId: { in: variantIds },
                order: {
                    status: {
                        in: ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED']
                    }
                }
            }
        });

        // Map sales to dictionary for O(1) lookup
        const salesMap = new Map<string, number>();
        salesAgg.forEach(agg => {
            if (agg.variantId) {
                salesMap.set(agg.variantId, agg._sum.quantity || 0);
            }
        });

        // Attach totalSales and virtual 'image' field to each product
        return products.map(p => {
            const productSales = p.variants.reduce((sum, v) => sum + (salesMap.get(v.id) || 0), 0);
            return {
                ...p,
                totalSales: productSales,
                image: p.images?.[0] || null // Virtual field for frontend compatibility
            };
        });
    }

    async findOne(storeId: string, id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, storeId },
            include: {
                variants: {
                    include: { inventory: true }
                },
                card: true, // IMPORTANT: Include card metadata
                category: true
            }
        });
        if (!product) throw new NotFoundException('Product not found');
        return {
            ...product,
            image: product.images?.[0] || null // Virtual field for frontend compatibility
        };
    }

    async remove(storeId: string, id: string) {
        // Ensure product exists and belongs to store
        await this.findOne(storeId, id);
        return this.prisma.product.delete({
            where: { id }
        });
    }

    async update(storeId: string, id: string, dto: UpdateProductDto) {
        // Ensure product exists
        const product = await this.findOne(storeId, id);

        return this.prisma.$transaction(async (tx) => {
            // 1. Update Product Core
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                    game: dto.game,
                    categoryId: dto.categoryId,
                    set: dto.set,
                    rarity: dto.rarity,
                    collectorNumber: dto.collectorNumber,
                    price: dto.price,
                    images: dto.images,
                }
            });

            // 2. Handle Variants if provided
            if (dto.variants) {
                // Get existing variants
                const existingVariants = await tx.productVariant.findMany({
                    where: { productId: id },
                    select: { id: true }
                });
                const existingIds = existingVariants.map(v => v.id);

                // Identify variants to delete (those not in the new list)
                const incomingIds = dto.variants.filter(v => v.id).map(v => v.id);
                const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));

                if (toDelete.length > 0) {
                    await tx.productVariant.deleteMany({
                        where: { id: { in: toDelete } }
                    });
                }

                // Upsert variants
                for (const v of dto.variants) {
                    if (v.id) {
                        // Update existing
                        await tx.productVariant.update({
                            where: { id: v.id },
                            data: {
                                condition: v.condition,
                                isFoil: v.isFoil,
                                language: v.language,
                                price: v.price,
                                costPrice: v.costPrice !== undefined ? v.costPrice : undefined,
                                inventory: {
                                    update: {
                                        quantity: v.quantity
                                    }
                                }
                            }
                        });
                    } else {
                        // Create new
                        if (!v.condition || v.price === undefined || v.quantity === undefined) {
                            throw new Error("Condition, Price, and Quantity are required for new variants");
                        }

                        // Generate SKU for new variant
                        const sku = this.generateSku(
                            updatedProduct.game || 'MTG',
                            updatedProduct.set || 'UNK',
                            updatedProduct.collectorNumber || '000',
                            updatedProduct.name,
                            v.condition,
                            v.language || 'English',
                            v.isFoil || false
                        );

                        await tx.productVariant.create({
                            data: {
                                sku: sku,
                                productId: id,
                                condition: v.condition,
                                isFoil: v.isFoil || false,
                                language: v.language || 'English',
                                price: v.price,
                                costPrice: v.costPrice || null,
                                storeId,
                                inventory: {
                                    create: {
                                        quantity: v.quantity,
                                        storeId
                                    }
                                }
                            }
                        });
                    }
                }
            }

            return updatedProduct;
        }, { timeout: 30000 });


    }
}
