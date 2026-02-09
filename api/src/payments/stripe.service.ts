import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(private configService: ConfigService) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2024-12-18.acacia',
        });
    }

    /**
     * Create a Checkout Session for payment
     * Returns the session URL to redirect customer to
     */
    async createCheckoutSession(params: {
        items: Array<{
            name: string;
            price: number; // in dollars
            quantity: number;
        }>;
        customerEmail: string;
        orderId: string; // Store in metadata for webhook
        successUrl: string;
        cancelUrl: string;
    }): Promise<{ sessionId: string; url: string }> {
        const lineItems = params.items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100), // Convert to cents
            },
            quantity: item.quantity,
        }));

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: params.customerEmail,
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            metadata: {
                orderId: params.orderId,
            },
        });

        return {
            sessionId: session.id,
            url: session.url!,
        };
    }

    /**
     * Verify webhook signature from Stripe
     */
    verifyWebhookSignature(payload: Buffer, signature: string): Stripe.Event {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
        }

        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        );
    }

    /**
     * Retrieve a checkout session by ID
     */
    async getSession(sessionId: string): Promise<Stripe.Checkout.Session> {
        return this.stripe.checkout.sessions.retrieve(sessionId);
    }

    /**
     * Retrieve a payment intent
     */
    async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        return this.stripe.paymentIntents.retrieve(paymentIntentId);
    }
}
