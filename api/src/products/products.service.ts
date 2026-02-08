import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async create(storeId: string, dto: CreateProductDto) {
        // Generate a simple slug
        const slug = dto.name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();

        return this.prisma.$transaction(async (tx) => {
            let cardId = null;

            // 1. Handle Card Identity (Oracle)
            if (dto.oracleId) {
                const card = await tx.card.upsert({
                    where: { oracleId: dto.oracleId },
                    update: {
                        // Update details if they changed (optional, could just keep existing)
                        legalities: dto.legalities,
                        // oracleText: dto.oracleText // If we passed it
                    },
                    create: {
                        oracleId: dto.oracleId,
                        name: dto.name, // Use the product name as the card name
                        oracleText: dto.oracleText || '',
                        legalities: dto.legalities
                    }
                });
                cardId = card.id;
            }

            // 2. Create Product (Printing)
            return tx.product.create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    game: dto.game,
                    categoryId: dto.categoryId,
                    set: dto.set,
                    rarity: dto.rarity,
                    collectorNumber: dto.collectorNumber,
                    // Remove fields that moved to Card
                    // oracleId: dto.oracleId, 
                    // legalities: dto.legalities,
                    cardId: cardId, // Link to Card

                    price: dto.price, // Save root price
                    slug: slug,
                    images: dto.images || [],
                    storeId,
                    variants: {
                        create: dto.variants?.map(v => ({
                            condition: v.condition,
                            isFoil: v.isFoil || false,
                            language: v.language || 'English',
                            price: v.price,
                            storeId,
                            inventory: {
                                create: {
                                    quantity: v.quantity,
                                    storeId
                                }
                            }
                        })),
                    },
                },
                include: {
                    variants: {
                        include: { inventory: true }
                    },
                    card: true // Return card details
                },
            });
        });
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

        // Attach totalSales to each product
        return products.map(p => {
            const productSales = p.variants.reduce((sum, v) => sum + (salesMap.get(v.id) || 0), 0);
            return {
                ...p,
                totalSales: productSales
            };
        });
    }

    async findOne(storeId: string, id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, storeId },
            include: {
                variants: {
                    include: { inventory: true }
                }
            }
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
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
                    // Slug update logic could go here if needed, but risky for SEO
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
                        await tx.productVariant.create({
                            data: {
                                productId: id,
                                condition: v.condition,
                                isFoil: v.isFoil || false,
                                language: v.language || 'English',
                                price: v.price,
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
        });
    }
}
