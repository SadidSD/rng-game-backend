import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { OrdersService } from '../orders/orders.service';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private stripeService: StripeService,
        private ordersService: OrdersService,
    ) { }

    @Post('webhook')
    @ApiOperation({ summary: 'Stripe webhook endpoint' })
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        const payload = req.rawBody;

        if (!payload) {
            throw new Error('No raw body available');
        }

        // Verify the webhook signature
        const event = this.stripeService.verifyWebhookSignature(payload, signature);

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const orderId = session.metadata?.orderId;

                if (orderId) {
                    console.log(`[Stripe] Payment successful for order: ${orderId}`);
                    // Complete the order - deduct inventory
                    await this.ordersService.completePayment(orderId);
                } else {
                    console.warn('[Stripe] No orderId in session metadata');
                }
                break;

            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log(`[Stripe] PaymentIntent ${paymentIntent.id} succeeded`);
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                console.log(`[Stripe] Payment failed: ${failedIntent.id}`);
                // TODO: Send notification to admin about failed payment
                break;

            default:
                console.log(`[Stripe] Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }
}
