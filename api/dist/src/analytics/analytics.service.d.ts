import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(storeId: string): Promise<{
        totalSales: number;
        totalOrders: number;
        totalCustomers: number;
        buylistQueue: number;
        totalProducts: number;
        lowStockAlerts: number;
        lowStockItems: {
            id: string;
            name: string;
            game: string;
            stock: number;
            threshold: number;
        }[];
        recentOrders: ({
            customer: {
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
            } | null;
        } & {
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
        })[];
        chartData: {
            name: string;
            total: number;
        }[];
    }>;
    private aggregateSalesByDay;
}
