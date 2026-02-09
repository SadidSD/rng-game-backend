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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(storeId, dto) {
        const slug = dto.name.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
        return this.prisma.$transaction(async (tx) => {
            let cardId = null;
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
                        loyalty: dto.loyalty
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
            return tx.product.create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    game: dto.game,
                    categoryId: dto.categoryId,
                    set: dto.set,
                    rarity: dto.rarity,
                    collectorNumber: dto.collectorNumber,
                    cardId: cardId,
                    price: dto.price,
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
                    card: true
                },
            });
        });
    }
    async findAll(storeId, query) {
        const where = { storeId };
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
        const variantIds = products.flatMap(p => p.variants.map(v => v.id));
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
        const salesMap = new Map();
        salesAgg.forEach(agg => {
            if (agg.variantId) {
                salesMap.set(agg.variantId, agg._sum.quantity || 0);
            }
        });
        return products.map(p => {
            const productSales = p.variants.reduce((sum, v) => sum + (salesMap.get(v.id) || 0), 0);
            return {
                ...p,
                totalSales: productSales
            };
        });
    }
    async findOne(storeId, id) {
        const product = await this.prisma.product.findFirst({
            where: { id, storeId },
            include: {
                variants: {
                    include: { inventory: true }
                }
            }
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async remove(storeId, id) {
        await this.findOne(storeId, id);
        return this.prisma.product.delete({
            where: { id }
        });
    }
    async update(storeId, id, dto) {
        const product = await this.findOne(storeId, id);
        return this.prisma.$transaction(async (tx) => {
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
            if (dto.variants) {
                const existingVariants = await tx.productVariant.findMany({
                    where: { productId: id },
                    select: { id: true }
                });
                const existingIds = existingVariants.map(v => v.id);
                const incomingIds = dto.variants.filter(v => v.id).map(v => v.id);
                const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
                if (toDelete.length > 0) {
                    await tx.productVariant.deleteMany({
                        where: { id: { in: toDelete } }
                    });
                }
                for (const v of dto.variants) {
                    if (v.id) {
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
                    }
                    else {
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map