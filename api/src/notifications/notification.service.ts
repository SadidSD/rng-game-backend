import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
    private resend: Resend;

    constructor(
        private configService: ConfigService,
        private logger: LoggerService,
    ) {
        this.logger.setContext('NotificationService');

        const resendApiKey = this.configService.get('RESEND_API_KEY');

        if (resendApiKey) {
            this.resend = new Resend(resendApiKey);
            this.logger.info('Resend client initialized');
        } else {
            this.logger.warn('RESEND_API_KEY not configured - notifications will be logged only');
        }
    }

    /**
     * Send order confirmation to admin
     */
    async sendOrderNotification(orderData: {
        orderId: string;
        customerEmail: string;
        total: number;
        itemCount: number;
    }) {
        const adminEmail = this.configService.get('ADMIN_EMAIL');

        if (!adminEmail) {
            this.logger.warn('ADMIN_EMAIL not configured - skipping email notification');
            this.logger.info(`New order: ${orderData.orderId} from ${orderData.customerEmail} - Total: $${orderData.total}`);
            return;
        }

        const subject = `New Order #${orderData.orderId.substring(0, 8)}`;
        const html = `
      <h2>New Order Received!</h2>
      <p><strong>Order ID:</strong> ${orderData.orderId}</p>
      <p><strong>Customer:</strong> ${orderData.customerEmail}</p>
      <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
      <p><strong>Items:</strong> ${orderData.itemCount}</p>
      <p><em>Check your admin dashboard for full details.</em></p>
    `;

        try {
            if (this.resend) {
                await this.resend.emails.send({
                    from: this.configService.get('RESEND_FROM_EMAIL') || 'store@yourdomain.com',
                    to: adminEmail,
                    subject,
                    html,
                });
                this.logger.info(`Order notification email sent to ${adminEmail}`);
            } else {
                this.logger.info(`Order notification (email not configured): ${subject}`);
            }
        } catch (error: any) {
            this.logger.error(`Failed to send order notification email: ${error.message}`);
        }
    }

    /**
     * Send low stock alert to admin
     */
    async sendLowStockAlert(items: { productName: string; sku: string; quantity: number }[]) {
        const adminEmail = this.configService.get('ADMIN_EMAIL');

        if (!adminEmail) {
            this.logger.warn('Low stock detected but ADMIN_EMAIL not configured');
            return;
        }

        const subject = `⚠️ Low Stock Alert - ${items.length} products`;
        const itemsList = items.map(item =>
            `<li>${item.productName} (SKU: ${item.sku}) - ${item.quantity} remaining</li>`
        ).join('');

        const html = `
      <h2>Low Stock Alert</h2>
      <p>The following products are running low on inventory:</p>
      <ul>${itemsList}</ul>
      <p><em>Consider restocking these items soon.</em></p>
    `;

        try {
            if (this.resend) {
                await this.resend.emails.send({
                    from: this.configService.get('RESEND_FROM_EMAIL') || 'store@yourdomain.com',
                    to: adminEmail,
                    subject,
                    html,
                });
                this.logger.info(`Low stock alert email sent to ${adminEmail}`);
            } else {
                this.logger.warn(`Low stock alert (email not configured): ${items.length} items low`);
            }
        } catch (error: any) {
            this.logger.error(`Failed to send low stock alert email: ${error.message}`);
        }
    }
}
