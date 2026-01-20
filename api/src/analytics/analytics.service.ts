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
        const lowStockItems = await this.prisma.inventoryItem.findMany({
            where: { storeId, quantity: { lt: 5 } },
            take: 4,
            include: {
                variant: {
                    include: { product: true }
                }
            }
        });

        const lowStockCount = await this.prisma.inventoryItem.count({
            where: { storeId, quantity: { lt: 5 } }
        });

        // 5. Buylist Queue (Pending)
        // Check if BuylistOffer model exists on prisma client type (it should)
        // @ts-ignore
        const buylistCount = await this.prisma.buylistOffer.count({
            where: { storeId, status: 'PENDING' }
        });

        // 6. Recent Orders
        const recentOrders = await this.prisma.order.findMany({
            where: { storeId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });

        // 7. Sales Chart (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const lastWeekOrders = await this.prisma.order.findMany({
            where: {
                storeId,
                createdAt: { gte: sevenDaysAgo },
                status: { not: 'CANCELLED' }
            },
            select: { createdAt: true, total: true }
        });

        // Group by day name (Mon, Tue, etc.)
        const chartData = this.aggregateSalesByDay(lastWeekOrders);

        return {
            totalSales: Number(salesAgg._sum.total || 0),
            totalOrders: salesAgg._count.id,
            totalCustomers: customerCount,
            buylistQueue: buylistCount,
            totalProducts: productCount,
            lowStockAlerts: lowStockCount,
            lowStockItems: lowStockItems.map(i => ({
                id: i.id,
                name: i.variant.product.name,
                game: i.variant.product.game || 'TCG',
                stock: i.quantity,
                threshold: 5
            })),
            recentOrders,
            chartData
        };
    }

    private aggregateSalesByDay(orders: { createdAt: Date, total: any }[]) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const map = new Map<string, number>();

        // Initialize last 7 days keys to ensure empty days verify
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = days[d.getDay()];
            map.set(dayName, 0);
        }

        for (const o of orders) {
            const dayName = days[new Date(o.createdAt).getDay()];
            const current = map.get(dayName) || 0;
            map.set(dayName, current + Number(o.total));
        }

        return Array.from(map.entries()).map(([name, total]) => ({ name, total }));
    }
}
