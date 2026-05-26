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

    async getAdvancedStats(storeId: string, startDate?: string, endDate?: string) {
        // Parse date filter
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const orderWhereClause: any = {
            storeId,
            status: { not: 'CANCELLED' }
        };

        if (startDate || endDate) {
            orderWhereClause.createdAt = dateFilter;
        }

        // 1. Fetch Orders within date range
        const orders = await this.prisma.order.findMany({
            where: orderWhereClause,
            include: {
                items: true,
                customer: true
            }
        });

        // 2. Map all order items and fetch variant info
        const orderItems = orders.flatMap(o => o.items);
        const variantIds = [...new Set(orderItems.map(i => i.variantId).filter(Boolean))] as string[];
        
        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: {
                product: {
                    include: { category: true }
                }
            }
        });
        const variantMap = new Map(variants.map(v => [v.id, v]));

        // 3. Sales by Game & Category Breakdown
        const gameSalesMap = new Map<string, number>();
        const categorySalesMap = new Map<string, number>();
        const topProductsMap = new Map<string, { name: string, sku: string, qty: number, revenue: number }>();

        for (const item of orderItems) {
            const variant = item.variantId ? variantMap.get(item.variantId) : null;
            const game = variant?.product?.game || 'Other';
            const category = variant?.product?.category?.name || 'Uncategorized';
            const price = Number(item.price);
            const qty = item.quantity;
            const totalItemSales = price * qty;

            // Group by Game
            gameSalesMap.set(game, (gameSalesMap.get(game) || 0) + totalItemSales);
            
            // Group by Category
            categorySalesMap.set(category, (categorySalesMap.get(category) || 0) + totalItemSales);

            // Group by Product for top sellers
            const key = item.variantSku || item.productName;
            const currentProduct = topProductsMap.get(key) || { name: item.productName, sku: item.variantSku || 'N/A', qty: 0, revenue: 0 };
            currentProduct.qty += qty;
            currentProduct.revenue += totalItemSales;
            topProductsMap.set(key, currentProduct);
        }

        const gameSales = Array.from(gameSalesMap.entries()).map(([name, value]) => ({ name, value }));
        const categorySales = Array.from(categorySalesMap.entries()).map(([name, value]) => ({ name, value }));
        
        const topProducts = Array.from(topProductsMap.values())
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 10);

        // 4. Inventory Valuation
        const inventoryItems = await this.prisma.inventoryItem.findMany({
            where: { storeId },
            include: { variant: true }
        });

        let totalRetailValue = 0;
        let totalCostBasis = 0;

        for (const item of inventoryItems) {
            if (!item.variant) continue;
            const retail = Number(item.variant.price) * item.quantity;
            const cost = Number(item.variant.costPrice || 0) * item.quantity;
            totalRetailValue += retail;
            totalCostBasis += cost;
        }

        const grossMargin = totalRetailValue > 0 
            ? ((totalRetailValue - totalCostBasis) / totalRetailValue) * 100 
            : 0;

        // 5. Customer Metrics
        const customers = await this.prisma.customer.findMany({
            where: { storeId }
        });
        const totalStoreCredit = customers.reduce((acc, curr) => acc + Number(curr.creditBalance), 0);

        // Calculate repeat customers from all store orders
        const allStoreOrders = await this.prisma.order.findMany({
            where: { storeId, status: { not: 'CANCELLED' } },
            select: { customerId: true, total: true }
        });

        const customerOrderCounts = new Map<string, { count: number, totalSpend: number }>();
        for (const o of allStoreOrders) {
            if (!o.customerId) continue;
            const current = customerOrderCounts.get(o.customerId) || { count: 0, totalSpend: 0 };
            current.count += 1;
            current.totalSpend += Number(o.total);
            customerOrderCounts.set(o.customerId, current);
        }

        const customerDetailsMap = new Map(customers.map(c => [c.id, c]));
        const customerLeaderboard = Array.from(customerOrderCounts.entries()).map(([id, stats]) => {
            const customer = customerDetailsMap.get(id);
            return {
                id,
                name: customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'Unknown',
                email: customer?.email || 'Unknown',
                ordersCount: stats.count,
                lifetimeSpend: stats.totalSpend
            };
        }).sort((a, b) => b.lifetimeSpend - a.lifetimeSpend).slice(0, 10);

        const uniqueCustomersWithOrders = customerOrderCounts.size;
        const repeatCustomersCount = Array.from(customerOrderCounts.values()).filter(c => c.count >= 2).length;
        const repeatCustomerRate = uniqueCustomersWithOrders > 0 
            ? (repeatCustomersCount / uniqueCustomersWithOrders) * 100 
            : 0;

        // 6. Buylist Metrics
        // @ts-ignore
        const completedBuylists = await this.prisma.buylistOffer.findMany({
            where: { storeId, status: 'COMPLETED' },
            select: { totalCash: true, totalCredit: true }
        });

        let totalBuylistCash = 0;
        let totalBuylistCredit = 0;
        for (const b of completedBuylists) {
            totalBuylistCash += Number(b.totalCash);
            totalBuylistCredit += Number(b.totalCredit);
        }

        return {
            gameSales,
            categorySales,
            topProducts,
            inventoryValuation: {
                retailValue: totalRetailValue,
                costBasis: totalCostBasis,
                grossMargin
            },
            customerMetrics: {
                totalStoreCredit,
                repeatCustomerRate,
                customerLeaderboard
            },
            buylistMetrics: {
                totalCashPayout: totalBuylistCash,
                totalCreditPayout: totalBuylistCredit,
                totalPayout: totalBuylistCash + totalBuylistCredit
            }
        };
    }
}
