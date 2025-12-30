import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats(storeId: string) {
        // 1. Total Sales & Order Count
        const salesAgg = await this.prisma.order.aggregate({
            where: { storeId, status: { not: 'CANCELLED' } },
            _sum: { total: true },
            _count: { id: true }
        });

        // 2. Customer Count
        const customerCount = await this.prisma.customer.count({
            where: { storeId }
        });

        // 3. Product Count
        const productCount = await this.prisma.product.count({
            where: { storeId }
        });

        // 4. Low Stock Items (Inventory < 5)
        // Note: Inventory is nested, so this is trickier. 
        // We can count InventoryItems directly since they have storeId.
        const lowStockCount = await this.prisma.inventoryItem.count({
            where: { storeId, quantity: { lt: 5 } }
        });

        // 5. Recent Orders
        const recentOrders = await this.prisma.order.findMany({
            where: { storeId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });

        return {
            totalSales: Number(salesAgg._sum.total || 0),
            totalOrders: salesAgg._count.id,
            totalCustomers: customerCount,
            totalProducts: productCount,
            lowStockAlerts: lowStockCount,
            recentOrders
        };
    }
}
