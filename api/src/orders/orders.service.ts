import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../payments/stripe.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { NotificationService } from '../notifications/notification.service';
import { EasypostService } from '../integrations/easypost/easypost.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private stripeService: StripeService,
        private configService: ConfigService,
        private logger: LoggerService,
        private notificationService: NotificationService,
        private easypostService: EasypostService,
    ) {
        this.logger.setContext('OrdersService');
    }

    /**
     * Create an order and initiate Stripe payment
     * Returns Stripe Checkout Session URL
     */
    /**
     * Create an order and initiate Stripe payment
     * Returns Stripe Checkout Session URL
     */
    async create(storeId: string, dto: CreateOrderDto) {
        const isStoreCredit = dto.paymentMethod === 'store_credit';

        // 1. Transactional Part: Gather data and create order record
        // We move external API calls (Stripe) outside this block to avoid timeouts.
        const { order, stripeLineItems, success } = await this.prisma.$transaction(async (tx) => {
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

                // Check stock
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

                if (!isStoreCredit) {
                    stripeLineItems.push({
                        name: `${variant.product.name} (${variant.condition}${variant.isFoil ? ' - Foil' : ''})`,
                        price: price,
                        quantity: itemDto.quantity,
                    });
                }
            }

            // 2. Find or Create Customer
            let customer = await tx.customer.findFirst({
                where: { storeId, email: dto.customerEmail }
            });

            if (!customer) {
                if (isStoreCredit) {
                    throw new BadRequestException('Customer profile not found. Cannot checkout with store credit.');
                }
                customer = await tx.customer.create({
                    data: {
                        storeId,
                        email: dto.customerEmail,
                        firstName: dto.customerFirstName,
                        lastName: dto.customerLastName
                    }
                });
            }

            // Handle Store Credit deduction & inventory checkout immediately
            if (isStoreCredit) {
                if (Number(customer.creditBalance) < total) {
                    throw new BadRequestException(`Insufficient store credit. Required: $${total.toFixed(2)}, Available: $${Number(customer.creditBalance).toFixed(2)}`);
                }

                // Deduct customer credit balance
                await tx.customer.update({
                    where: { id: customer.id },
                    data: { creditBalance: { decrement: total } }
                });

                // Deduct inventory counts
                for (const itemDto of dto.items) {
                    await tx.inventoryItem.update({
                        where: { variantId: itemDto.variantId },
                        data: { quantity: { decrement: itemDto.quantity } }
                    });
                }
            }

            // 3. Create Order
            const newOrder = await tx.order.create({
                data: {
                    storeId,
                    customerId: customer.id,
                    total: total,
                    status: isStoreCredit ? 'PAID' : 'PENDING',
                    paymentStatus: isStoreCredit ? 'PAID' : 'PENDING',
                    paidAt: isStoreCredit ? new Date() : null,
                    shippingName: dto.shippingName,
                    shippingAddress: dto.shippingAddress,
                    shippingCity: dto.shippingCity,
                    shippingState: dto.shippingState,
                    shippingCountry: dto.shippingCountry,
                    shippingZip: dto.shippingZip,
                    items: {
                        create: orderItemsData
                    }
                },
                include: { items: true }
            });

            return { order: newOrder, stripeLineItems, success: isStoreCredit };
        }, {
            timeout: 15000 // Increase timeout to 15s to handle database latency
        });

        // If paid with store credit, complete order immediately and skip Stripe creation
        if (success) {
            await this.notificationService.sendOrderNotification({
                orderId: order.id,
                customerEmail: dto.customerEmail,
                total: Number(order.total),
                itemCount: order.items.length,
            }).catch(err => this.logger.error(`Failed to send store credit order notification: ${err.message}`));

            return {
                orderId: order.id,
                total: Number(order.total),
                paidWithCredit: true
            };
        }

        // 4. External Part: Create Stripe Checkout Session (Outside DB Transaction)
        try {
            const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
            const checkoutSession = await this.stripeService.createCheckoutSession({
                items: stripeLineItems,
                customerEmail: dto.customerEmail,
                orderId: order.id,
                successUrl: `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${frontendUrl}/checkout?cancelled=true`,
            });

            // 5. Update order with Stripe session ID (Separate DB call)
            await this.prisma.order.update({
                where: { id: order.id },
                data: { stripeSessionId: checkoutSession.sessionId }
            });

            return {
                orderId: order.id,
                stripeSessionUrl: checkoutSession.url,
                total: Number(order.total),
            };
        } catch (error) {
            this.logger.error(`Failed to create Stripe session for order ${order.id}: ${error.message}`);
            // Note: The PENDING order exists in DB but user sees an error and can retry.
            throw new BadRequestException('Failed to initialize payment gateway. Please try again.');
        }
    }

    /**
     * Complete payment - called by webhook after Stripe confirms payment
     * Deducts inventory and updates order status
     */
    async completePayment(orderId: string) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true, customer: true }
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

            // Send admin notification
            await this.notificationService.sendOrderNotification({
                orderId: updatedOrder.id,
                customerEmail: order.customer?.email || 'unknown',
                total: Number(updatedOrder.total),
                itemCount: order.items.length,
            }).catch(err => this.logger.error(`Failed to send notification: ${err.message}`));

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

    /**
     * Complete Order Fulfillment using EasyPost
     * Buys a label and triggers shipment notification to customer
     */
    async fulfillOrder(storeId: string, orderId: string, easypostRateId: string, easypostShipmentId: string) {
        const order = await this.findOne(storeId, orderId);
        if (!order) throw new NotFoundException('Order not found');

        // Buy label
        const labelData = await this.easypostService.buyLabel(easypostShipmentId, easypostRateId);

        // Update database with tracking info
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'SHIPPED',
                trackingNumber: labelData.trackingCode,
                labelUrl: labelData.labelUrl,
                easypostShipmentId: easypostShipmentId
            }
        });

        this.logger.info(`Order ${orderId} officially fulfilled - Tracking: ${labelData.trackingCode}`);

        // Send tracking email to customer
        if (order.customer?.email) {
            await this.notificationService.sendShippingNotification(
                order.customer.email,
                labelData.trackingCode,
                labelData.labelUrl,
            ).catch(err => this.logger.error(`Failed to send shipping notification: ${err.message}`));
        }

        return updatedOrder;
    }

    async findMyOrders(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException('User not found');

        const customer = await this.prisma.customer.findUnique({
            where: { storeId_email: { storeId: user.storeId, email: user.email } }
        });

        if (!customer) return [];

        return this.prisma.order.findMany({
            where: { customerId: customer.id },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findCustomerOrder(userId: string, orderId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) throw new NotFoundException('User not found');

        const customer = await this.prisma.customer.findUnique({
            where: { storeId_email: { storeId: user.storeId, email: user.email } }
        });
        if (!customer) throw new NotFoundException('Customer profile not found');

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true, customer: true }
        });

        if (!order || order.customerId !== customer.id) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async getEasyPostRates(storeId: string, orderId: string) {
        const order = await this.findOne(storeId, orderId);
        if (!order) throw new NotFoundException('Order not found');

        const toAddress = {
            name: order.shippingName || 'Customer',
            street1: order.shippingAddress || '',
            city: order.shippingCity || '',
            state: order.shippingState || 'NY', // Fallback for safety
            zip: order.shippingZip || '',
            country: order.shippingCountry || 'US',
        };

        const fromAddress = {
            name: this.configService.get<string>('STORE_SHIPPING_NAME') || 'RNG Gamez Shop',
            street1: this.configService.get<string>('STORE_SHIPPING_STREET') || '123 Main St',
            city: this.configService.get<string>('STORE_SHIPPING_CITY') || 'Brooklyn',
            state: this.configService.get<string>('STORE_SHIPPING_STATE') || 'NY',
            zip: this.configService.get<string>('STORE_SHIPPING_ZIP') || '11201',
            country: this.configService.get<string>('STORE_SHIPPING_COUNTRY') || 'US',
            phone: this.configService.get<string>('STORE_SHIPPING_PHONE') || '555-555-5555',
        };

        const parcel = {
            length: 8,
            width: 5,
            height: 0.5,
            weight: 3.0, // 3 ounces for a standard card mailer
        };

        try {
            const shipment = await this.easypostService.createShipment(toAddress, fromAddress, parcel);
            return {
                shipmentId: shipment.id,
                rates: shipment.rates.map((r: any) => ({
                    id: r.id,
                    carrier: r.carrier,
                    service: r.service,
                    rate: r.rate,
                    deliveryDays: r.delivery_days,
                    estDeliveryDate: r.est_delivery_date,
                })),
            };
        } catch (error: any) {
            this.logger.error(`Failed to generate EasyPost rates for order ${orderId}: ${error.message}`);
            throw new BadRequestException(`EasyPost error: ${error.message}`);
        }
    }
}
