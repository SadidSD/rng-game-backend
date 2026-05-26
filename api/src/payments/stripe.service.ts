import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe | null = null;
    private isConfigured: boolean = false;

    constructor(private configService: ConfigService) {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

        if (!secretKey || secretKey.includes('REPLACE')) {
            console.warn('[StripeService] STRIPE_SECRET_KEY not configured - payment features disabled');
            this.isConfigured = false;
        } else {
            this.stripe = new Stripe(secretKey, {
                apiVersion: '2026-01-28.clover',
            });
            this.isConfigured = true;
            console.log('[StripeService] Initialized successfully');
        }
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
        // --- DEVELOPER MOCK MODE ---
        // If Stripe isn't configured, return a simulated success URL for testing
        if (!this.isConfigured || !this.stripe) {
            console.warn(`[StripeService] MOCK MODE: Simulating checkout for order ${params.orderId}`);
            
            // Generate a fake session ID
            const fakeSessionId = `mock_session_${Date.now()}`;
            
            // Redirect to the success URL but replaced the placeholder
            const mockUrl = params.successUrl.replace('{CHECKOUT_SESSION_ID}', fakeSessionId);
            
            return {
                sessionId: fakeSessionId,
                url: mockUrl,
            };
        }

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
            payment_intent_data: {
                metadata: {
                    orderId: params.orderId,
                },
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
        if (!this.isConfigured || !this.stripe) {
            throw new Error('Stripe is not configured');
        }

        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret || webhookSecret.includes('REPLACE')) {
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
        if (!this.isConfigured || !this.stripe) {
            throw new Error('Stripe is not configured');
        }
        return this.stripe.checkout.sessions.retrieve(sessionId);
    }

    /**
     * Retrieve a payment intent
     */
    async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        if (!this.isConfigured || !this.stripe) {
            throw new Error('Stripe is not configured');
        }
        return this.stripe.paymentIntents.retrieve(paymentIntentId);
    }
}
