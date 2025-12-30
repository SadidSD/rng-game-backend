import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async create(storeId: string, dto: CreateOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Validate Stock and Calculate Total
            let total = 0;
            const orderItemsData: any[] = [];

            for (const itemDto of dto.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: itemDto.variantId },
                    include: { inventory: true, product: true }
                });


                if (!variant) throw new NotFoundException(`Variant ${itemDto.variantId} not found`);
                if (variant.product.storeId !== storeId) throw new BadRequestException('Product does not belong to this store');

                // Check stock
                const currentStock = variant.inventory?.quantity || 0;
                if (currentStock < itemDto.quantity) {
                    throw new BadRequestException(`Insufficient stock for ${variant.product.name} (Requested: ${itemDto.quantity}, Available: ${currentStock})`);
                }

                // Deduct Stock
                await tx.inventoryItem.update({
                    where: { variantId: variant.id },
                    data: { quantity: { decrement: itemDto.quantity } }
                });

                // Snapshot Price
                const price = Number(variant.price); // Decimal to Number
                total += price * itemDto.quantity;

                orderItemsData.push({
                    productName: variant.product.name,
                    variantSku: variant.sku,
                    quantity: itemDto.quantity,
                    price: variant.price,
                    variantId: variant.id
                });
            }

            // 2. Find or Create Customer
            // For MVP, simplistic upsert or find
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

            // 3. Create Order
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

    async findAll(storeId: string) {
        return this.prisma.order.findMany({
            where: { storeId },
            include: { items: true, customer: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(storeId: string, id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { items: true, customer: true }
        });
        if (!order || order.storeId !== storeId) throw new NotFoundException('Order not found');
        return order;
    }

    async updateStatus(storeId: string, id: string, dto: UpdateOrderStatusDto) {
        // Verify ownership implicitly via update many or check first
        // using updateMany ensures storeId matches
        const { count } = await this.prisma.order.updateMany({
            where: { id, storeId },
            data: { status: dto.status }
        });

        if (count === 0) throw new NotFoundException('Order not found');
        return this.findOne(storeId, id);
    }
}
