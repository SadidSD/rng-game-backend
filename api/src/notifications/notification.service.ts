import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
    private resend: Resend | null = null;
    private gmailTransporter: nodemailer.Transporter | null = null;
    private fromEmail: string;

    constructor(
        private configService: ConfigService,
        private logger: LoggerService,
    ) {
        this.logger.setContext('NotificationService');

        // --- Option 1: Resend (requires verified domain) ---
        const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
        if (resendApiKey) {
            this.resend = new Resend(resendApiKey);
            this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@yourdomain.com';
            this.logger.info('Email provider: Resend');
            return;
        }

        // --- Option 2: Gmail SMTP (no domain needed, just Gmail + App Password) ---
        const gmailUser = this.configService.get<string>('GMAIL_USER');
        const gmailPass = this.configService.get<string>('GMAIL_APP_PASSWORD');
        if (gmailUser && gmailPass) {
            this.gmailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailUser,
                    pass: gmailPass,    // 16-char App Password from Google Account
                },
            });
            this.fromEmail = gmailUser;
            this.logger.info(`Email provider: Gmail SMTP (${gmailUser})`);
            return;
        }

        this.logger.warn(
            'No email provider configured. ' +
            'Set RESEND_API_KEY (+ RESEND_FROM_EMAIL) for Resend, ' +
            'or GMAIL_USER + GMAIL_APP_PASSWORD for Gmail SMTP. ' +
            'Order notifications will be logged only.'
        );
    }

    /**
     * Core send method — tries Resend first, then Gmail, then logs.
     */
    private async sendEmail(to: string, subject: string, html: string): Promise<void> {
        if (this.resend) {
            await this.resend.emails.send({ from: this.fromEmail, to, subject, html });
            this.logger.info(`Email sent via Resend to ${to}: ${subject}`);
            return;
        }

        if (this.gmailTransporter) {
            await this.gmailTransporter.sendMail({
                from: `"RNG Gamez Shop" <${this.fromEmail}>`,
                to,
                subject,
                html,
            });
            this.logger.info(`Email sent via Gmail to ${to}: ${subject}`);
            return;
        }

        // Fallback: just log it
        this.logger.info(`[EMAIL NOT SENT - no provider] To: ${to} | Subject: ${subject}`);
    }

    /**
     * Send new order notification to admin
     */
    async sendOrderNotification(orderData: {
        orderId: string;
        customerEmail: string;
        total: number;
        itemCount: number;
    }) {
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');

        if (!adminEmail) {
            this.logger.warn('ADMIN_EMAIL not configured - skipping order notification');
            this.logger.info(`New order: ${orderData.orderId} from ${orderData.customerEmail} - Total: $${orderData.total}`);
            return;
        }

        const subject = `🛒 New Order #${orderData.orderId.substring(0, 8).toUpperCase()}`;
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #111; margin-bottom: 16px;">New Order Received!</h2>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f0f0f0;">
                    <td style="padding: 12px 16px; font-weight: bold; color: #555;">Order ID</td>
                    <td style="padding: 12px 16px; font-family: monospace;">${orderData.orderId}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; font-weight: bold; color: #555;">Customer</td>
                    <td style="padding: 12px 16px;">${orderData.customerEmail}</td>
                </tr>
                <tr style="background: #f0f0f0;">
                    <td style="padding: 12px 16px; font-weight: bold; color: #555;">Items</td>
                    <td style="padding: 12px 16px;">${orderData.itemCount}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; font-weight: bold; color: #555;">Total</td>
                    <td style="padding: 12px 16px; font-size: 1.2em; font-weight: bold; color: #6d28d9;">$${orderData.total.toFixed(2)}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                <em>View full details in your <a href="${this.configService.get('ADMIN_DASHBOARD_URL') || '#'}" style="color: #6d28d9;">Admin Dashboard</a>.</em>
            </p>
        </div>
        `;

        try {
            await this.sendEmail(adminEmail, subject, html);
        } catch (error: any) {
            this.logger.error(`Failed to send order notification: ${error.message}`);
        }
    }

    /**
     * Send low stock alert to admin
     */
    async sendLowStockAlert(items: { productName: string; sku: string; quantity: number }[]) {
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');

        if (!adminEmail) {
            this.logger.warn('Low stock detected but ADMIN_EMAIL not configured');
            return;
        }

        const subject = `⚠️ Low Stock Alert — ${items.length} product${items.length !== 1 ? 's' : ''}`;
        const rows = items.map(item =>
            `<tr>
                <td style="padding: 10px 16px;">${item.productName}</td>
                <td style="padding: 10px 16px; font-family: monospace; color: #555;">${item.sku}</td>
                <td style="padding: 10px 16px; color: ${item.quantity <= 2 ? '#dc2626' : '#d97706'}; font-weight: bold;">${item.quantity} left</td>
            </tr>`
        ).join('');

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #d97706;">⚠️ Low Stock Alert</h2>
            <p style="color: #555;">The following products are running low and need restocking:</p>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="padding: 10px 16px; text-align: left; color: #555;">Product</th>
                        <th style="padding: 10px 16px; text-align: left; color: #555;">SKU</th>
                        <th style="padding: 10px 16px; text-align: left; color: #555;">Stock</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        `;

        try {
            await this.sendEmail(adminEmail, subject, html);
        } catch (error: any) {
            this.logger.error(`Failed to send low stock alert: ${error.message}`);
        }
    }

    /**
     * Send order shipped notification to customer
     */
    async sendShippingNotification(customerEmail: string, trackingCode: string, trackingUrl?: string) {
        const subject = `📦 Your order has shipped! Tracking: ${trackingCode}`;
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #111;">Your Order Has Shipped! 📦</h2>
            <p style="color: #555;">Great news — your order is on its way!</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
                <p style="color: #888; font-size: 0.85em; margin: 0 0 8px;">TRACKING NUMBER</p>
                <p style="font-family: monospace; font-size: 1.3em; font-weight: bold; color: #111; margin: 0;">${trackingCode}</p>
                ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 24px; background: #6d28d9; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Your Package</a>` : ''}
            </div>
            <p style="color: #888; font-size: 0.85em; text-align: center;">Thank you for shopping with RNG Gamez!</p>
        </div>
        `;

        try {
            await this.sendEmail(customerEmail, subject, html);
        } catch (error: any) {
            this.logger.error(`Failed to send shipping notification: ${error.message}`);
        }
    }
}
