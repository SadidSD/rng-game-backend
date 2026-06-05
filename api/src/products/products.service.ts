import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Condition } from '@prisma/client';
import { ScryfallService } from '../integrations/scryfall.service';
import { PokemonTcgService } from '../integrations/pokemon-tcg/pokemon-tcg.service';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private scryfallService: ScryfallService,
        private pokemonTcgService: PokemonTcgService
    ) { }

    // Helper: Generate SKU
    // Format: GAME-SET-COLLECTOR-SLUG-COND-LANG-FINISH-STORE
    private generateSku(
        game: string,
        set: string,
        collectorNumber: string,
        name: string,
        condition: Condition,
        language: string,
        isFoil: boolean,
        storeId?: string
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

        const storeSuffix = storeId ? `-${storeId.substring(0, 4).toUpperCase()}` : '';

        return `${gameCode}-${setCode}-${collector}-${slug}-${condCode}-${langCode}-${finishCode}${storeSuffix}`;
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
                        throw new BadRequestException(`Category ${dto.categoryId} not found for this store.`);
                    }
                }

                // 3. Check if Product with same set and collector number already exists for this store
                const existingProduct = (dto.set && dto.collectorNumber)
                    ? await tx.product.findFirst({
                        where: {
                            storeId,
                            set: dto.set,
                            collectorNumber: dto.collectorNumber,
                            name: dto.name
                        },
                        include: {
                            variants: {
                                include: { inventory: true }
                            }
                        }
                    })
                    : null;

                if (existingProduct) {
                    // Update product price & description if updated info was sent
                    const updatedProduct = await tx.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            price: dto.price !== undefined ? dto.price : existingProduct.price,
                            images: dto.images && dto.images.length > 0 ? dto.images : existingProduct.images,
                            description: dto.description || existingProduct.description
                        }
                    });

                    // Upsert variants
                    const variantsToReturn: any[] = [];
                    for (const v of dto.variants || []) {
                        const sku = this.generateSku(
                            dto.game || 'MTG',
                            dto.set || 'UNK',
                            dto.collectorNumber || '000',
                            dto.name,
                            v.condition,
                            v.language || 'English',
                            v.isFoil || false,
                            storeId
                        );

                        // Match existing variant by SKU or structural match
                        const existingVariant = existingProduct.variants.find(
                            ev => ev.sku === sku || (ev.condition === v.condition && ev.isFoil === (v.isFoil || false) && ev.language === (v.language || 'English'))
                        );

                        if (existingVariant) {
                            // Update price, costPrice and increment inventory quantity
                            const updatedVariant = await tx.productVariant.update({
                                where: { id: existingVariant.id },
                                data: {
                                    price: v.price,
                                    costPrice: v.costPrice !== undefined ? v.costPrice : existingVariant.costPrice,
                                    inventory: {
                                        update: {
                                            quantity: {
                                                increment: v.quantity
                                            }
                                        }
                                    }
                                },
                                include: { inventory: true }
                            });
                            variantsToReturn.push(updatedVariant);
                        } else {
                            // Create variant
                            const newVariant = await tx.productVariant.create({
                                data: {
                                    sku: sku,
                                    productId: existingProduct.id,
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
                                },
                                include: { inventory: true }
                            });
                            variantsToReturn.push(newVariant);
                        }
                    }

                    return {
                        ...updatedProduct,
                        variants: variantsToReturn,
                        card: cardId ? await tx.card.findUnique({ where: { id: cardId } }) : null
                    };
                }

                // 4. Create Product (Printing) if it doesn't exist
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
                                    v.isFoil || false,
                                    storeId
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
            } catch (error: any) {
                console.error(' [ProductsService] Transaction Failed:', error);
                if (error.code === 'P2002') {
                    throw new ConflictException(`A product variant with SKU or key attributes already exists in the catalog.`);
                }
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
                            v.isFoil || false,
                            storeId
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

    async importLookup(storeId: string, query: { name: string; set?: string; collectorNumber?: string; game?: string }) {
        const game = (query.game || '').toUpperCase();
        
        // 1. Check local db first by name, and optionally set & collector number
        const existingProduct = await this.prisma.product.findFirst({
            where: {
                storeId,
                name: { equals: query.name, mode: 'insensitive' },
                ...(query.set ? { set: { equals: query.set, mode: 'insensitive' } } : {}),
                ...(query.collectorNumber ? { collectorNumber: query.collectorNumber } : {})
            },
            include: {
                card: true,
                variants: {
                    include: { inventory: true }
                }
            }
        });

        if (existingProduct) {
            return {
                source: 'database',
                name: existingProduct.name,
                set: existingProduct.set || null,
                collectorNumber: existingProduct.collectorNumber || null,
                oracleId: existingProduct.card?.oracleId || null,
                image: existingProduct.images?.[0] || null,
                price: Number(existingProduct.price || 0),
                game: existingProduct.game || 'MTG',
                exists: true,
                productId: existingProduct.id
            };
        }

        // 2. Lookup via APIs based on game type
        if (game === 'POKEMON' || game === 'POKÉMON') {
            try {
                const extCard = await this.pokemonTcgService.getCardByDetails(query.name, query.set, query.collectorNumber);
                if (extCard) {
                    return {
                        source: 'pokemon-api',
                        name: extCard.name,
                        set: extCard.set,
                        collectorNumber: extCard.number,
                        oracleId: extCard.id, // Set ID as oracleId for Pokémon
                        image: extCard.image,
                        price: extCard.price,
                        game: 'Pokemon',
                        exists: false
                    };
                }
            } catch (err: any) {
                console.error('[ProductsService] Pokemon API Lookup error:', err.message);
            }
        } else {
            // Default to MTG/Scryfall
            try {
                const extCard = await this.scryfallService.getCardByDetails(query.name, query.set, query.collectorNumber);
                if (extCard) {
                    return {
                        source: 'scryfall-api',
                        name: extCard.name,
                        set: extCard.set,
                        collectorNumber: extCard.collectorNumber,
                        oracleId: extCard.oracleId,
                        image: extCard.image,
                        price: extCard.price,
                        game: 'MTG',
                        exists: false
                    };
                }
            } catch (err: any) {
                console.error('[ProductsService] Scryfall API Lookup error:', err.message);
            }
        }

        // 3. Fallback unmatched
        return {
            source: 'unmatched',
            name: query.name,
            set: query.set || null,
            collectorNumber: query.collectorNumber || null,
            oracleId: null,
            image: null,
            price: 0,
            game: game === 'POKEMON' ? 'Pokemon' : 'MTG',
            exists: false
        };
    }

    async importBatch(storeId: string, items: any[]) {
        const results: any[] = [];
        const errors: any[] = [];

        // Pre-fetch Category IDs for MTG and Pokemon to speed up mapping
        const categories = await this.prisma.category.findMany({
            where: { storeId }
        });
        const mtgCategory = categories.find(c => c.slug === 'magic-the-gathering');
        const pokemonCategory = categories.find(c => c.slug === 'pokemon');

        for (const item of items) {
            try {
                // Map default category ID based on the game
                let categoryId = item.categoryId;
                if (!categoryId) {
                    const gameUpper = (item.game || '').toUpperCase();
                    if (gameUpper === 'POKEMON' || gameUpper === 'POKÉMON') {
                        categoryId = pokemonCategory?.id;
                    } else if (gameUpper === 'MTG' || gameUpper === 'MAGIC' || gameUpper.includes('GATHERING')) {
                        categoryId = mtgCategory?.id;
                    }
                }

                // Construct CreateProductDto structure
                const dto: CreateProductDto = {
                    name: item.name,
                    description: item.description || `Card printing from set ${item.set}`,
                    game: item.game || 'MTG',
                    categoryId,
                    set: item.set,
                    rarity: item.rarity,
                    collectorNumber: item.collectorNumber,
                    oracleId: item.oracleId,
                    oracleText: item.oracleText,
                    legalities: item.legalities,
                    manaCost: item.manaCost,
                    manaValue: item.manaValue,
                    colors: item.colors,
                    colorIdentity: item.colorIdentity,
                    typeLine: item.typeLine,
                    supertypes: item.supertypes,
                    subtypes: item.subtypes,
                    power: item.power,
                    toughness: item.toughness,
                    loyalty: item.loyalty,
                    price: Number(item.price || 0),
                    images: item.image ? [item.image] : [],
                    variants: item.variants || [
                        {
                            condition: item.condition || 'NM',
                            isFoil: item.isFoil || false,
                            language: item.language || 'English',
                            price: Number(item.price || 0),
                            quantity: Number(item.quantity || 1)
                        }
                    ]
                };

                const created = await this.create(storeId, dto);
                results.push({ name: item.name, success: true, productId: created.id });
            } catch (err: any) {
                console.error(`[ProductsService] Batch import row failed for ${item.name}:`, err);
                errors.push({ name: item.name, success: false, error: err.message });
            }
        }

        return {
            importedCount: results.length,
            failedCount: errors.length,
            results,
            errors
        };
    }
}
