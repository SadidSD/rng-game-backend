import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customers.dto';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(storeId: string, dto: CreateCustomerDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        storeId: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
    }>;
    findAll(storeId: string, search?: string): Promise<({
        _count: {
            orders: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        storeId: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
    })[]>;
    findOne(storeId: string, id: string): Promise<{
        orders: {
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
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        storeId: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
    }>;
    update(storeId: string, id: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        storeId: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
    }>;
}
