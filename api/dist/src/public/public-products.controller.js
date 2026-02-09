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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicProductsController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../auth/guards/api-key.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let PublicProductsController = class PublicProductsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProducts(req) {
        const storeId = req.store.id;
        const query = req.query;
        const where = { storeId };
        const cardWhere = {};
        let hasCardFilters = false;
        if (query.name) {
            where.name = { contains: query.name, mode: 'insensitive' };
        }
        if (query.colors) {
            const colors = query.colors.split(',');
            cardWhere.colorIdentity = { hasSome: colors };
            hasCardFilters = true;
        }
        if (query.type) {
            cardWhere.typeLine = { contains: query.type, mode: 'insensitive' };
            hasCardFilters = true;
        }
        if (query.cmcMin || query.cmcMax) {
            cardWhere.manaValue = {};
            if (query.cmcMin)
                cardWhere.manaValue.gte = parseFloat(query.cmcMin);
            if (query.cmcMax)
                cardWhere.manaValue.lte = parseFloat(query.cmcMax);
            hasCardFilters = true;
        }
        if (query.format) {
            const format = query.format.toLowerCase();
            cardWhere.legalities = {
                path: [format],
                equals: 'legal'
            };
            hasCardFilters = true;
        }
        if (hasCardFilters) {
            where.card = cardWhere;
        }
        if (query.set) {
            where.set = { contains: query.set, mode: 'insensitive' };
        }
        if (query.rarity) {
            where.rarity = { equals: query.rarity, mode: 'insensitive' };
        }
        const variantWhere = {};
        let hasVariantFilters = false;
        if (query.priceMin || query.priceMax) {
            variantWhere.price = {};
            if (query.priceMin)
                variantWhere.price.gte = parseFloat(query.priceMin);
            if (query.priceMax)
                variantWhere.price.lte = parseFloat(query.priceMax);
            hasVariantFilters = true;
        }
        if (query.foil) {
            variantWhere.isFoil = query.foil === 'true';
            hasVariantFilters = true;
        }
        if (query.inStock === 'true') {
            variantWhere.inventory = {
                quantity: { gt: 0 }
            };
            hasVariantFilters = true;
        }
        if (hasVariantFilters) {
            where.variants = {
                some: variantWhere
            };
        }
        let orderBy = { createdAt: 'desc' };
        if (query.sort === 'price_asc')
            orderBy = { price: 'asc' };
        if (query.sort === 'price_desc')
            orderBy = { price: 'desc' };
        if (query.sort === 'name_asc')
            orderBy = { name: 'asc' };
        const products = await this.prisma.product.findMany({
            where,
            include: {
                variants: {
                    include: { inventory: true }
                },
                card: true,
                category: true
            },
            orderBy,
            take: 100
        });
        return {
            store: req.store.name,
            count: products.length,
            data: products
        };
    }
    async getProduct(req, id) {
        const storeId = req.store.id;
        const product = await this.prisma.product.findFirst({
            where: { id, storeId },
            include: {
                variants: {
                    include: { inventory: true }
                },
                card: true,
                category: true
            }
        });
        if (!product)
            return null;
        return product;
    }
};
exports.PublicProductsController = PublicProductsController;
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicProductsController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PublicProductsController.prototype, "getProduct", null);
exports.PublicProductsController = PublicProductsController = __decorate([
    (0, common_1.Controller)('public'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicProductsController);
//# sourceMappingURL=public-products.controller.js.map