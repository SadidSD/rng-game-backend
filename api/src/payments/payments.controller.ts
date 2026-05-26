import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { OrdersService } from '../orders/orders.service';
import { LoggerService } from '../logger/logger.service';
import { FastifyRequest } from 'fastify';

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
        @Req() req: RawBodyRequest<FastifyRequest>,
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
                if (paymentIntent.metadata?.orderId) {
                    await this.ordersService.completePayment(paymentIntent.metadata.orderId);
                }
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                this.logger.error(`Payment failed: ${failedIntent.id}`);

                if (failedIntent.metadata?.orderId) {
                    this.logger.warn(`Rolling back inventory for order: ${failedIntent.metadata.orderId}`);
                    await this.ordersService.rollbackInventory(failedIntent.metadata.orderId);
                }
                break;

            case 'checkout.session.expired':
                const expiredSession = event.data.object;
                const expiredOrderId = expiredSession.metadata?.orderId;

                if (expiredOrderId) {
                    this.logger.warn(`Checkout session expired for order: ${expiredOrderId}`);
                    // Mark order as cancelled (but don't rollback since inventory was never deducted)
                }
                break;

            default:
                this.logger.debug(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }
}
