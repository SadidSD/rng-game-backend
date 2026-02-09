import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';
import { OrdersService } from '../orders/orders.service';
import { LoggerService } from '../logger/logger.service';
import Stripe from 'stripe';

describe('PaymentsController - Webhook', () => {
    let controller: PaymentsController;
    let stripeService: StripeService;
    let ordersService: OrdersService;
    let loggerService: LoggerService;

    const mockStripeService = {
        verifyWebhookSignature: jest.fn(),
        getSession: jest.fn(),
    };

    const mockOrdersService = {
        completePayment: jest.fn(),
        rollbackInventory: jest.fn(),
    };

    const mockLoggerService = {
        setContext: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentsController],
            providers: [
                { provide: StripeService, useValue: mockStripeService },
                { provide: OrdersService, useValue: mockOrdersService },
                { provide: LoggerService, useValue: mockLoggerService },
            ],
        }).compile();

        controller = module.get<PaymentsController>(PaymentsController);
        stripeService = module.get<StripeService>(StripeService);
        ordersService = module.get<OrdersService>(OrdersService);
        loggerService = module.get<LoggerService>(LoggerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleWebhook - checkout.session.completed', () => {
        it('should complete payment when checkout session succeeds', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_test',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test',
                        metadata: { orderId: 'order-123' },
                    } as any,
                },
            } as any;

            mockStripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
            mockOrdersService.completePayment.mockResolvedValue({ id: 'order-123', status: 'PAID' });

            const mockReq = {
                rawBody: Buffer.from('test payload'),
            } as any;

            const result = await controller.handleWebhook(mockReq, 'test_signature');

            expect(result).toEqual({ received: true });
            expect(mockStripeService.verifyWebhookSignature).toHaveBeenCalled();
            expect(mockOrdersService.completePayment).toHaveBeenCalledWith('order-123');
            expect(mockLoggerService.info).toHaveBeenCalledWith(expect.stringContaining('Payment successful'));
        });

        it('should warn if orderId missing in metadata', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_test',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test',
                        metadata: {}, // No orderId
                    } as any,
                },
            } as any;

            mockStripeService.verifyWebhookSignature.mockReturnValue(mockEvent);

            const mockReq = {
                rawBody: Buffer.from('test payload'),
            } as any;

            const result = await controller.handleWebhook(mockReq, 'test_signature');

            expect(result).toEqual({ received: true });
            expect(mockOrdersService.completePayment).not.toHaveBeenCalled();
            expect(mockLoggerService.warn).toHaveBeenCalledWith('No orderId in session metadata');
        });
    });

    describe('handleWebhook - payment_intent.payment_failed', () => {
        it('should rollback inventory when payment fails', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_test',
                object: 'event',
                type: 'payment_intent.payment_failed',
                data: {
                    object: {
                        id: 'pi_test_failed',
                    } as any,
                },
            } as any;

            const mockSession = {
                metadata: { orderId: 'order-123' },
            };

            mockStripeService.verifyWebhookSignature.mockReturnValue(mockEvent);
            mockStripeService.getSession.mockResolvedValue(mockSession);
            mockOrdersService.rollbackInventory.mockResolvedValue({ id: 'order-123', status: 'FAILED' });

            const mockReq = {
                rawBody: Buffer.from('test payload'),
            } as any;

            const result = await controller.handleWebhook(mockReq, 'test_signature');

            expect(result).toEqual({ received: true });
            expect(mockLoggerService.error).toHaveBeenCalledWith(expect.stringContaining('Payment failed'));
            expect(mockOrdersService.rollbackInventory).toHaveBeenCalledWith('order-123');
        });
    });

    describe('handleWebhook - checkout.session.expired', () => {
        it('should log warning when session expires', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_test',
                object: 'event',
                type: 'checkout.session.expired',
                data: {
                    object: {
                        id: 'cs_test',
                        metadata: { orderId: 'order-123' },
                    } as any,
                },
            } as any;

            mockStripeService.verifyWebhookSignature.mockReturnValue(mockEvent);

            const mockReq = {
                rawBody: Buffer.from('test payload'),
            } as any;

            const result = await controller.handleWebhook(mockReq, 'test_signature');

            expect(result).toEqual({ received: true });
            expect(mockLoggerService.warn).toHaveBeenCalledWith(expect.stringContaining('Checkout session expired'));
        });
    });

    describe('handleWebhook - unhandled event', () => {
        it('should log debug for unhandled event types', async () => {
            const mockEvent: Stripe.Event = {
                id: 'evt_test',
                object: 'event',
                type: 'customer.created',
                data: {
                    object: {} as any,
                },
            } as any;

            mockStripeService.verifyWebhookSignature.mockReturnValue(mockEvent);

            const mockReq = {
                rawBody: Buffer.from('test payload'),
            } as any;

            const result = await controller.handleWebhook(mockReq, 'test_signature');

            expect(result).toEqual({ received: true });
            expect(mockLoggerService.debug).toHaveBeenCalledWith('Unhandled event type: customer.created');
        });
    });

    describe('handleWebhook - error handling', () => {
        it('should throw error if no raw body', async () => {
            const mockReq = {
                rawBody: null,
            } as any;

            await expect(controller.handleWebhook(mockReq, 'test_signature')).rejects.toThrow('No raw body available');
        });
    });
});
