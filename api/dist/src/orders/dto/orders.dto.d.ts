import { OrderStatus } from '@prisma/client';
export declare class OrderItemDto {
    variantId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    customerEmail: string;
    customerFirstName?: string;
    customerLastName?: string;
    shippingName?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingZip?: string;
    items: OrderItemDto[];
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
}
