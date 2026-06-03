import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';
import { NotificationService } from '../notifications/notification.service';
import axios from 'axios';

@Injectable()
export class TrackingService {
    private readonly aftershipKey: string | null;
    private readonly uspsUserId: string | null;
    private readonly AUTO_COMPLETE_DAYS = 7;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private logger: LoggerService,
        private notificationService: NotificationService,
    ) {
        this.logger.setContext('TrackingService');
        this.aftershipKey = this.configService.get<string>('AFTERSHIP_API_KEY') || null;
        this.uspsUserId = this.configService.get<string>('USPS_USER_ID') || null;

        if (this.aftershipKey) {
            this.logger.info('Tracking provider: AfterShip API');
        } else if (this.uspsUserId) {
            this.logger.info('Tracking provider: USPS Web Tools API');
        } else {
            this.logger.warn(`Tracking provider: 7-day auto-complete fallback (no API key configured). Set AFTERSHIP_API_KEY or USPS_USER_ID for real-time delivery detection.`);
        }
    }

    /**
     * Runs every 6 hours to check delivery status of all SHIPPED orders.
     * Automatically promotes orders to COMPLETED when delivered.
     */
    @Cron(CronExpression.EVERY_6_HOURS)
    async checkDeliveryStatuses() {
        this.logger.info('Running delivery status check for all SHIPPED orders...');

        const shippedOrders = await this.prisma.order.findMany({
            where: {
                status: 'SHIPPED',
                trackingNumber: { not: null },
            },
            include: { customer: true },
        });

        if (shippedOrders.length === 0) {
            this.logger.info('No SHIPPED orders with tracking numbers found.');
            return;
        }

        this.logger.info(`Checking ${shippedOrders.length} SHIPPED order(s)...`);

        for (const order of shippedOrders) {
            try {
                await this.checkAndCompleteOrder(order);
            } catch (err: any) {
                this.logger.error(`Failed to check tracking for order ${order.id}: ${err.message}`);
            }
        }
    }

    /**
     * Check a single order and complete it if delivered.
     */
    private async checkAndCompleteOrder(order: any) {
        const tracking = order.trackingNumber!.trim();
        let isDelivered = false;

        if (this.aftershipKey) {
            isDelivered = await this.checkAfterShip(tracking);
        } else if (this.uspsUserId) {
            isDelivered = await this.checkUSPS(tracking);
        } else {
            isDelivered = this.checkByAge(order.updatedAt);
        }

        if (isDelivered) {
            await this.markDelivered(order);
        }
    }

    /**
     * AfterShip API — supports USPS, UPS, FedEx and 900+ carriers automatically.
     * Sign up free at https://www.aftership.com (100 shipments/month free)
     * Set env var: AFTERSHIP_API_KEY=your_key
     */
    private async checkAfterShip(trackingNumber: string): Promise<boolean> {
        try {
            const res = await axios.get(
                `https://api.aftership.com/v4/trackings/${trackingNumber}`,
                {
                    headers: {
                        'aftership-api-key': this.aftershipKey!,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                }
            );

            const tag = res.data?.data?.tracking?.tag;
            // AfterShip uses tag "Delivered" for delivered packages
            return tag === 'Delivered';
        } catch (err: any) {
            if (err.response?.status === 404) {
                // Tracking not found yet — not delivered
                return false;
            }
            throw err;
        }
    }

    /**
     * USPS Web Tools API — free, USPS-only.
     * Register free at https://www.usps.com/business/web-tools-apis/
     * Set env var: USPS_USER_ID=your_user_id
     */
    private async checkUSPS(trackingNumber: string): Promise<boolean> {
        try {
            const xml = `<TrackFieldRequest USERID="${this.uspsUserId}"><TrackID ID="${trackingNumber}"/></TrackFieldRequest>`;
            const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xml)}`;

            const res = await axios.get(url, { timeout: 10000, responseType: 'text' });
            const body: string = res.data;

            // USPS returns XML. Check for "DELIVERED" in the EventCode or summary
            return body.toUpperCase().includes('DELIVERED');
        } catch (err: any) {
            throw err;
        }
    }

    /**
     * Fallback: If no API key is configured, auto-complete orders that
     * have been SHIPPED for more than AUTO_COMPLETE_DAYS days.
     * This covers 95%+ of domestic USPS First Class packages.
     */
    private checkByAge(shippedAt: Date): boolean {
        const daysSinceShipped = (Date.now() - new Date(shippedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceShipped >= this.AUTO_COMPLETE_DAYS;
    }

    /**
     * Mark an order as COMPLETED (Delivered) and notify the customer.
     */
    private async markDelivered(order: any) {
        await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'COMPLETED' },
        });

        this.logger.info(`Order ${order.id} marked as COMPLETED (delivered). Tracking: ${order.trackingNumber}`);

        // Send delivery confirmation email to customer
        if (order.customer?.email) {
            await this.notificationService.sendDeliveryConfirmationEmail(
                order.customer.email,
                order.id,
                order.trackingNumber,
            ).catch(err =>
                this.logger.error(`Failed to send delivery email for order ${order.id}: ${err.message}`)
            );
        }
    }
}
