import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(storeId: string): Promise<{
        totalSales: number;
        totalOrders: number;
        totalCustomers: number;
        totalProducts: number;
        lowStockAlerts: number;
        recentOrders: ({
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
        })[];
    }>;
}
