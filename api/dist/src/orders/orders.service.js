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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(storeId, dto) {
        return this.prisma.$transaction(async (tx) => {
            let total = 0;
            const orderItemsData = [];
            for (const itemDto of dto.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: itemDto.variantId },
                    include: { inventory: true, product: true }
                });
                if (!variant)
                    throw new common_1.NotFoundException(`Variant ${itemDto.variantId} not found`);
                if (variant.product.storeId !== storeId)
                    throw new common_1.BadRequestException('Product does not belong to this store');
                const currentStock = variant.inventory?.quantity || 0;
                if (currentStock < itemDto.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${variant.product.name} (Requested: ${itemDto.quantity}, Available: ${currentStock})`);
                }
                await tx.inventoryItem.update({
                    where: { variantId: variant.id },
                    data: { quantity: { decrement: itemDto.quantity } }
                });
                const price = Number(variant.price);
                total += price * itemDto.quantity;
                orderItemsData.push({
                    productName: variant.product.name,
                    variantSku: variant.sku,
                    quantity: itemDto.quantity,
                    price: variant.price,
                    variantId: variant.id
                });
            }
            let customer = await tx.customer.findFirst({
                where: { storeId, email: dto.customerEmail }
            });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        storeId,
                        email: dto.customerEmail,
                        firstName: dto.customerFirstName,
                        lastName: dto.customerLastName
                    }
                });
            }
            const order = await tx.order.create({
                data: {
                    storeId,
                    customerId: customer.id,
                    total: total,
                    status: 'PENDING',
                    shippingName: dto.shippingName,
                    shippingAddress: dto.shippingAddress,
                    shippingCity: dto.shippingCity,
                    shippingZip: dto.shippingZip,
                    items: {
                        create: orderItemsData
                    }
                },
                include: { items: true }
            });
            return order;
        });
    }
    async findAll(storeId) {
        return this.prisma.order.findMany({
            where: { storeId },
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findOne(storeId, id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true, customer: true }
        });
        if (!order || order.storeId !== storeId)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async updateStatus(storeId, id, dto) {
        const { count } = await this.prisma.order.updateMany({
            where: { id, storeId },
            data: { status: dto.status }
        });
        if (count === 0)
            throw new common_1.NotFoundException('Order not found');
        return this.findOne(storeId, id);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map