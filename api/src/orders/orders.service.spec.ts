import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../payments/stripe.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrdersService', () => {
    let service: OrdersService;
    let prisma: PrismaService;
    let stripeService: StripeService;

    const mockPrismaService = {
        $transaction: jest.fn(),
        order: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            updateMany: jest.fn(),
        },
    };

    const mockStripeService = {
        createCheckoutSession: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'FRONTEND_URL') return 'http://localhost:3000';
            return null;
        }),
    };

    const mockLoggerService = {
        setContext: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: StripeService, useValue: mockStripeService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: LoggerService, useValue: mockLoggerService },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        prisma = module.get<PrismaService>(PrismaService);
        stripeService = module.get<StripeService>(StripeService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create order and return Stripe session URL', async () => {
            const storeId = 'store-123';
            const createOrderDto = {
                items: [
                    { variantId: 'variant-1', quantity: 2 },
                ],
                customerEmail: 'test@example.com',
                customerFirstName: 'John',
                customerLastName: 'Doe',
                shippingName: 'John Doe',
                shippingAddress: '123 Main St',
                shippingCity: 'New York',
                shippingZip: '10001',
            };

            const mockVariant = {
                id: 'variant-1',
                price: 10.00,
                product: { id: 'prod-1', name: 'Test Card', storeId },
                inventory: { quantity: 10 },
                condition: 'NM',
                isFoil: false,
                sku: 'TEST-001',
            };

            const mockOrder = {
                id: 'order-123',
                storeId,
                total: 20.00,
                status: 'PENDING',
                items: [],
            };

            const mockCheckoutSession = {
                sessionId: 'session-123',
                url: 'https://checkout.stripe.com/session-123',
            };

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                const mockTx = {
                    productVariant: {
                        findUnique: jest.fn().mockResolvedValue(mockVariant),
                    },
                    customer: {
                        findFirst: jest.fn().mockResolvedValue(null),
                        create: jest.fn().mockResolvedValue({ id: 'customer-1', email: 'test@example.com' }),
                    },
                    order: {
                        create: jest.fn().mockResolvedValue(mockOrder),
                        update: jest.fn().mockResolvedValue(mockOrder),
                    },
                };

                mockStripeService.createCheckoutSession.mockResolvedValue(mockCheckoutSession);

                return callback(mockTx);
            });

            const result = await service.create(storeId, createOrderDto);

            expect(result).toHaveProperty('orderId');
            expect(result).toHaveProperty('stripeSessionUrl');
            expect(result.stripeSessionUrl).toBe('https://checkout.stripe.com/session-123');
            expect(mockStripeService.createCheckoutSession).toHaveBeenCalled();
        });

        it('should throw BadRequestException if stock insufficient', async () => {
            const storeId = 'store-123';
            const createOrderDto = {
                items: [{ variantId: 'variant-1', quantity: 100 }],
                customerEmail: 'test@example.com',
                customerFirstName: 'John',
                customerLastName: 'Doe',
                shippingName: 'John Doe',
                shippingAddress: '123 Main St',
                shippingCity: 'New York',
                shippingZip: '10001',
            };

            const mockVariant = {
                id: 'variant-1',
                price: 10.00,
                product: { id: 'prod-1', name: 'Test Card', storeId },
                inventory: { quantity: 5 }, // Only 5 in stock
            };

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                const mockTx = {
                    productVariant: {
                        findUnique: jest.fn().mockResolvedValue(mockVariant),
                    },
                };
                return callback(mockTx);
            });

            await expect(service.create(storeId, createOrderDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('completePayment', () => {
        it('should deduct inventory and mark order as PAID', async () => {
            const orderId = 'order-123';
            const mockOrder = {
                id: orderId,
                paymentStatus: 'PENDING',
                items: [
                    { variantId: 'variant-1', quantity: 2 },
                ],
            };

            const mockVariant = {
                id: 'variant-1',
                inventory: { quantity: 10 },
            };

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                const mockTx = {
                    order: {
                        findUnique: jest.fn().mockResolvedValue(mockOrder),
                        update: jest.fn().mockResolvedValue({ ...mockOrder, paymentStatus: 'PAID', status: 'PAID' }),
                    },
                    productVariant: {
                        findUnique: jest.fn().mockResolvedValue(mockVariant),
                    },
                    inventoryItem: {
                        update: jest.fn().mockResolvedValue({ quantity: 8 }),
                    },
                };
                return callback(mockTx);
            });

            const result = await service.completePayment(orderId);

            expect(result.paymentStatus).toBe('PAID');
            expect(mockLoggerService.info).toHaveBeenCalledWith(expect.stringContaining('Payment completed'));
        });

        it('should not process payment twice for same order', async () => {
            const orderId = 'order-123';
            const mockOrder = {
                id: orderId,
                paymentStatus: 'PAID', // Already paid
                items: [],
            };

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                const mockTx = {
                    order: {
                        findUnique: jest.fn().mockResolvedValue(mockOrder),
                    },
                };
                return callback(mockTx);
            });

            const result = await service.completePayment(orderId);

            expect(result.paymentStatus).toBe('PAID');
            expect(mockLoggerService.info).toHaveBeenCalledWith(expect.stringContaining('already paid'));
        });
    });

    describe('rollbackInventory', () => {
        it('should restore inventory and mark order as FAILED', async () => {
            const orderId = 'order-123';
            const mockOrder = {
                id: orderId,
                paymentStatus: 'PAID', // Was marked as paid
                items: [
                    { variantId: 'variant-1', quantity: 2 },
                ],
            };

            const mockVariant = {
                id: 'variant-1',
                inventory: { quantity: 8 },
            };

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                const mockTx = {
                    order: {
                        findUnique: jest.fn().mockResolvedValue(mockOrder),
                        update: jest.fn().mockResolvedValue({ ...mockOrder, paymentStatus: 'FAILED', status: 'CANCELLED' }),
                    },
                    productVariant: {
                        findUnique: jest.fn().mockResolvedValue(mockVariant),
                    },
                    inventoryItem: {
                        update: jest.fn().mockResolvedValue({ quantity: 10 }), // Restored
                    },
                };
                return callback(mockTx);
            });

            const result = await service.rollbackInventory(orderId);

            expect(result?.paymentStatus).toBe('FAILED');
            expect(mockLoggerService.info).toHaveBeenCalledWith(expect.stringContaining('Inventory rolled back'));
        });
    });
});
