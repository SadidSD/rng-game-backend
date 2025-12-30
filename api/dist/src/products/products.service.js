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
        return this.prisma.product.create({
            data: {
                name: dto.name,
                description: dto.description,
                game: dto.game,
                set: dto.set,
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
                }
            },
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
        return this.prisma.product.findMany({
            where,
            include: { variants: true },
            orderBy: { createdAt: 'desc' },
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
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map