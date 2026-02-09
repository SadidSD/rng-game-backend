import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customers.dto';
export declare class CustomersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(storeId: string, dto: CreateCustomerDto): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(storeId: string, search?: string): Promise<({
        _count: {
            orders: number;
        };
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(storeId: string, id: string): Promise<{
        orders: {
            id: string;
            storeId: string;
            createdAt: Date;
            updatedAt: Date;
            orderNumber: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            total: import("@prisma/client/runtime/library").Decimal;
            customerId: string | null;
            shippingName: string | null;
            shippingAddress: string | null;
            shippingCity: string | null;
            shippingZip: string | null;
            trackingNumber: string | null;
        }[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(storeId: string, id: string, dto: UpdateCustomerDto): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        firstName: string | null;
        lastName: string | null;
        phone: string | null;
        notes: string | null;
        creditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
}
