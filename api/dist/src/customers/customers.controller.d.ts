import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customers.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(req: any, dto: CreateCustomerDto): Promise<{
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
    findAll(req: any, search: string): Promise<({
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
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, dto: UpdateCustomerDto): Promise<{
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
