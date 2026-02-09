import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../payments/stripe.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private stripeService: StripeService,
        private configService: ConfigService,
        private logger: LoggerService,
    ) {
        this.logger.setContext('OrdersService');
    }

    /**
     * Create an order and initiate Stripe payment
     * Returns Stripe Checkout Session URL
     */
    async create(storeId: string, dto: CreateOrderDto) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Validate Stock and Calculate Total
            let total = 0;
            const orderItemsData: any[] = [];
            const stripeLineItems: any[] = [];

            for (const itemDto of dto.items) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: itemDto.variantId },
                    include: { inventory: true, product: true }
                });

                if (!variant) throw new NotFoundException(`Variant ${itemDto.variantId} not found`);
                if (variant.product.storeId !== storeId) throw new BadRequestException('Product does not belong to this store');

                // Check stock (don't deduct yet - wait for payment)
                const currentStock = variant.inventory?.quantity || 0;
                if (currentStock < itemDto.quantity) {
                    throw new BadRequestException(`Insufficient stock for ${variant.product.name} (Requested: ${itemDto.quantity}, Available: ${currentStock})`);
                }

                // Snapshot Price
                const price = Number(variant.price);
                total += price * itemDto.quantity;

                orderItemsData.push({
                    productName: variant.product.name,
                    variantSku: variant.sku,
                    quantity: itemDto.quantity,
                    price: variant.price,
                    variantId: variant.id
                });

                stripeLineItems.push({
                    name: `${variant.product.name} (${variant.condition}${variant.isFoil ? ' - Foil' : ''})`,
                    price: price,
                    quantity: itemDto.quantity,
                });
            }

            // 2. Find or Create Customer
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

            // 3. Create Order (PENDING status, no inventory deduction yet)
            const order = await tx.order.create({
                data: {
                    storeId,
                    customerId: customer.id,
                    total: total,
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
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

            // 4. Create Stripe Checkout Session
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
            const checkoutSession = await this.stripeService.createCheckoutSession({
                items: stripeLineItems,
                customerEmail: dto.customerEmail,
                orderId: order.id,
                successUrl: `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${frontendUrl}/checkout?cancelled=true`,
            });

            // 5. Update order with Stripe session ID
            await tx.order.update({
                where: { id: order.id },
                data: { stripeSessionId: checkoutSession.sessionId }
            });

            return {
                orderId: order.id,
                stripeSessionUrl: checkoutSession.url,
                total: total,
            };
        });
    }

    /**
     * Complete payment - called by webhook after Stripe confirms payment
     * Deducts inventory and updates order status
     */
    async completePayment(orderId: string) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order) throw new NotFoundException('Order not found');
            if (order.paymentStatus === 'PAID') {
                this.logger.info(`Order ${orderId} already paid`);
                return order;
            }

            // Deduct inventory for each item
            for (const item of order.items) {
                if (!item.variantId) continue; // Skip if variant was deleted

                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { inventory: true }
                });

                if (!variant) {
                    this.logger.warn(`Variant ${item.variantId} not found, skipping inventory deduction`);
                    continue;
                }

                const currentStock = variant.inventory?.quantity || 0;
                if (currentStock < item.quantity) {
                    // Stock insufficient - this shouldn't happen if we validated earlier
                    // Log warning but don't fail the payment
                    this.logger.error(`Insufficient stock for ${variant.id}: requested ${item.quantity}, available ${currentStock}`);
                    continue;
                }

                await tx.inventoryItem.update({
                    where: { variantId: variant.id },
                    data: { quantity: { decrement: item.quantity } }
                });
            }

            // Update order status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paymentStatus: 'PAID',
                    paidAt: new Date(),
                }
            });

            this.logger.info(`Payment completed for order ${orderId}`);
            return updatedOrder;
        });
    }

    /**
     * Rollback inventory - called when payment fails
     * This method restores inventory if it was mistakenly deducted
     */
    async rollbackInventory(orderId: string) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order) {
                this.logger.warn(`Cannot rollback - order ${orderId} not found`);
                return null;
            }

            // Only rollback if payment was marked as PAID (mistakenly)
            if (order.paymentStatus !== 'PAID') {
                this.logger.info(`No rollback needed for order ${orderId} - status: ${order.paymentStatus}`);
                return order;
            }

            // Restore inventory for each item
            for (const item of order.items) {
                if (!item.variantId) continue;

                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { inventory: true }
                });

                if (variant && variant.inventory) {
                    await tx.inventoryItem.update({
                        where: { variantId: variant.id },
                        data: { quantity: { increment: item.quantity } }
                    });
                    this.logger.info(`Restored ${item.quantity} units of variant ${variant.id}`);
                }
            }

            // Mark order as FAILED
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED',
                }
            });

            this.logger.info(`Inventory rolled back for order ${orderId}`);
            return updatedOrder;
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
        const { count } = await this.prisma.order.updateMany({
            where: { id, storeId },
            data: { status: dto.status }
        });

        if (count === 0) throw new NotFoundException('Order not found');
        return this.findOne(storeId, id);
    }
}
