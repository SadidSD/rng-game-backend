import { Type } from 'class-transformer';
import {
    IsArray,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested
} from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderItemDto {
    @IsString()
    @IsNotEmpty()
    variantId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsEmail()
    customerEmail: string;

    @IsString()
    @IsOptional()
    customerFirstName?: string;

    @IsString()
    @IsOptional()
    customerLastName?: string;

    // Shipping
    @IsString()
    @IsOptional()
    shippingName?: string;

    @IsString()
    @IsOptional()
    shippingAddress?: string;

    @IsString()
    @IsOptional()
    shippingCity?: string;

    @IsString()
    @IsOptional()
    shippingState?: string;

    @IsString()
    @IsOptional()
    shippingCountry?: string;

    @IsString()
    @IsOptional()
    shippingZip?: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsString()
    @IsOptional()
    trackingNumber?: string;
}

export class FulfillOrderDto {
    @IsString()
    @IsNotEmpty()
    easypostRateId: string;

    @IsString()
    @IsNotEmpty()
    easypostShipmentId: string;
}

export class UpdateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    variantId: string;

    @IsNumber()
    @Min(0)
    quantity: number;
}

export class UpdateOrderItemsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateOrderItemDto)
    items: UpdateOrderItemDto[];
}
