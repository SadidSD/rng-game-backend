import { Controller, Post, Body, Headers } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {

    @Post('stripe')
    handleStripeWebhook(@Body() payload: any, @Headers('stripe-signature') signature: string) {
        console.log('[Webhook] Received Stripe Event:', payload.type);
        // TODO: Verify signature and handle event (payment_intent.succeeded)
        return { received: true };
    }

    @Post('ebay')
    handleEbayWebhook(@Body() payload: any) {
        console.log('[Webhook] Received eBay Event');
        return { received: true };
    }
}
