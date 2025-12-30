export declare class WebhooksController {
    handleStripeWebhook(payload: any, signature: string): {
        received: boolean;
    };
    handleEbayWebhook(payload: any): {
        received: boolean;
    };
}
