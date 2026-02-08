import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(req: any): Promise<{
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
        })[];
        chartData: {
            name: string;
            total: number;
        }[];
    }>;
}
