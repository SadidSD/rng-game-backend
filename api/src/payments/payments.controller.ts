import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { OrdersService } from '../orders/orders.service';
import { LoggerService } from '../logger/logger.service';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private stripeService: StripeService,
        private ordersService: OrdersService,
        private logger: LoggerService,
    ) {
        this.logger.setContext('PaymentsController');
    }

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
                    this.logger.info(`Payment successful for order: ${orderId}`);
                    // Complete the order - deduct inventory
                    await this.ordersService.completePayment(orderId);
                } else {
                    this.logger.warn('No orderId in session metadata');
                }
                break;

            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                this.logger.info(`PaymentIntent ${paymentIntent.id} succeeded`);
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                this.logger.error(`Payment failed: ${failedIntent.id}`);
                // TODO: Send notification to admin about failed payment
                break;

            default:
                this.logger.debug(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }
}
