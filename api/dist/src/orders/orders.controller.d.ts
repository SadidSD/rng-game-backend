import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/orders.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any, dto: CreateOrderDto): Promise<{
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            orderId: string;
            productName: string;
            variantSku: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        customerId: string | null;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        trackingNumber: string | null;
    }>;
    findAll(req: any): Promise<({
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
            creditBalance: import("@prisma/client/runtime/library").Decimal;
        } | null;
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            orderId: string;
            productName: string;
            variantSku: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        customerId: string | null;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        trackingNumber: string | null;
    })[]>;
    findOne(req: any, id: string): Promise<{
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
            creditBalance: import("@prisma/client/runtime/library").Decimal;
        } | null;
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            orderId: string;
            productName: string;
            variantSku: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        customerId: string | null;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        trackingNumber: string | null;
    }>;
    updateStatus(req: any, id: string, dto: UpdateOrderStatusDto): Promise<{
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
            creditBalance: import("@prisma/client/runtime/library").Decimal;
        } | null;
        items: {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            quantity: number;
            variantId: string | null;
            orderId: string;
            productName: string;
            variantSku: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        orderNumber: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        customerId: string | null;
        shippingName: string | null;
        shippingAddress: string | null;
        shippingCity: string | null;
        shippingZip: string | null;
        trackingNumber: string | null;
    }>;
}
