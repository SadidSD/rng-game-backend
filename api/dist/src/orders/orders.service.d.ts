import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
export declare class OrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(storeId: string, dto: CreateOrderDto): Promise<{
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            productName: string;
            variantSku: string | null;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        orderNumber: number;
        total: import("@prisma/client/runtime/library").Decimal;
        trackingNumber: string | null;
        customerId: string | null;
    }>;
    findAll(storeId: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            storeId: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            notes: string | null;
        } | null;
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            productName: string;
            variantSku: string | null;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        orderNumber: number;
        total: import("@prisma/client/runtime/library").Decimal;
        trackingNumber: string | null;
        customerId: string | null;
    })[]>;
    findOne(storeId: string, id: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            storeId: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            notes: string | null;
        } | null;
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            productName: string;
            variantSku: string | null;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        orderNumber: number;
        total: import("@prisma/client/runtime/library").Decimal;
        trackingNumber: string | null;
        customerId: string | null;
    }>;
    updateStatus(storeId: string, id: string, dto: UpdateOrderStatusDto): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            storeId: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            notes: string | null;
        } | null;
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            productName: string;
            variantSku: string | null;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        orderNumber: number;
        total: import("@prisma/client/runtime/library").Decimal;
        trackingNumber: string | null;
        customerId: string | null;
    }>;
}
