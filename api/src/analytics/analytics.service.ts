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

    async getAdvancedStats(
        storeId: string,
        startDate?: string,
        endDate?: string,
        game?: string,
        category?: string
    ) {
        // 1. Setup date ranges
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const periodMs = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - periodMs);

        // 2. Fetch Orders in current and previous periods
        const allOrders = await this.prisma.order.findMany({
            where: {
                storeId,
                createdAt: { gte: start, lte: end }
            },
            include: {
                items: true,
                customer: true
            }
        });

        const prevOrders = await this.prisma.order.findMany({
            where: {
                storeId,
                createdAt: { gte: prevStart, lte: prevEnd }
            },
            include: {
                items: true
            }
        });

        // 3. Map variants to filter by game & category
        const orderItems = allOrders.flatMap(o => o.items);
        const prevOrderItems = prevOrders.flatMap(o => o.items);
        
        const allVariantIds = [
            ...new Set([
                ...orderItems.map(i => i.variantId),
                ...prevOrderItems.map(i => i.variantId)
            ].filter(Boolean))
        ] as string[];

        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: allVariantIds } },
            include: {
                product: {
                    include: { category: true }
                }
            }
        });
        const variantMap = new Map(variants.map(v => [v.id, v]));

        // 4. Apply Filters (Game & Category)
        const filterItem = (item: any) => {
            const variant = item.variantId ? variantMap.get(item.variantId) : null;
            if (game && variant?.product?.game !== game) return false;
            if (category && variant?.product?.category?.name !== category) return false;
            return true;
        };

        const filteredOrders = allOrders.map(o => ({
            ...o,
            items: o.items.filter(filterItem)
        })).filter(o => o.items.length > 0);

        const filteredPrevOrders = prevOrders.map(o => ({
            ...o,
            items: o.items.filter(filterItem)
        })).filter(o => o.items.length > 0);

        // ==========================================
        // TAB 1: BUSINESS OVERVIEW & SALES TRENDS
        // ==========================================
        let grossRevenue = 0;
        let orderVolume = filteredOrders.length;
        
        for (const order of filteredOrders) {
            if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
                grossRevenue += order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
            }
        }

        const aov = orderVolume > 0 ? grossRevenue / orderVolume : 0;

        // Growth metrics
        let prevGrossRevenue = 0;
        for (const order of filteredPrevOrders) {
            if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
                prevGrossRevenue += order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
            }
        }
        const revenueGrowth = prevGrossRevenue > 0 
            ? ((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100 
            : 0;

        // Daily trends
        const dailyMap = new Map<string, { revenue: number; orders: number }>();
        const tempDate = new Date(start);
        while (tempDate <= end) {
            const key = tempDate.toISOString().split('T')[0];
            dailyMap.set(key, { revenue: 0, orders: 0 });
            tempDate.setDate(tempDate.getDate() + 1);
        }

        for (const order of filteredOrders) {
            const key = new Date(order.createdAt).toISOString().split('T')[0];
            const current = dailyMap.get(key) || { revenue: 0, orders: 0 };
            if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
                current.revenue += order.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
            }
            current.orders += 1;
            dailyMap.set(key, current);
        }

        const salesTrend = Array.from(dailyMap.entries()).map(([date, val]) => ({
            date,
            revenue: val.revenue,
            orders: val.orders
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Order Status Distribution
        const statusMap = new Map<string, number>();
        for (const order of filteredOrders) {
            statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1);
        }
        const statusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

        // Game and category breakdown of sales
        const gameSalesMap = new Map<string, number>();
        const categorySalesMap = new Map<string, number>();
        const topProductsMap = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();

        for (const order of filteredOrders) {
            if (order.status === 'CANCELLED' || order.status === 'REFUNDED') continue;
            for (const item of order.items) {
                const variant = item.variantId ? variantMap.get(item.variantId) : null;
                const g = variant?.product?.game || 'Other';
                const c = variant?.product?.category?.name || 'Uncategorized';
                const itemSales = Number(item.price) * item.quantity;

                gameSalesMap.set(g, (gameSalesMap.get(g) || 0) + itemSales);
                categorySalesMap.set(c, (categorySalesMap.get(c) || 0) + itemSales);

                const key = item.variantSku || item.productName;
                const currP = topProductsMap.get(key) || { name: item.productName, sku: item.variantSku || 'N/A', qty: 0, revenue: 0 };
                currP.qty += item.quantity;
                currP.revenue += itemSales;
                topProductsMap.set(key, currP);
            }
        }

        const gameSales = Array.from(gameSalesMap.entries()).map(([name, value]) => ({ name, value }));
        const categorySales = Array.from(categorySalesMap.entries()).map(([name, value]) => ({ name, value }));
        const topProducts = Array.from(topProductsMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);

        // ==========================================
        // TAB 2: FINANCIAL DETAILS & COGS
        // ==========================================
        let totalCogs = 0;
        for (const order of filteredOrders) {
            if (order.status === 'CANCELLED' || order.status === 'REFUNDED') continue;
            for (const item of order.items) {
                const variant = item.variantId ? variantMap.get(item.variantId) : null;
                const costPrice = variant?.costPrice ? Number(variant.costPrice) : 0;
                totalCogs += costPrice * item.quantity;
            }
        }

        const netProfit = grossRevenue - totalCogs;
        const grossMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

        // Refund rates
        const totalRefundedCount = allOrders.filter(o => o.status === 'REFUNDED').length;
        const totalRefundedValue = allOrders
            .filter(o => o.status === 'REFUNDED')
            .reduce((sum, o) => sum + Number(o.total), 0);
        const refundRate = allOrders.length > 0 ? (totalRefundedCount / allOrders.length) * 100 : 0;

        // ==========================================
        // TAB 3: INVENTORY & VALUATION
        // ==========================================
        const inventoryItems = await this.prisma.inventoryItem.findMany({
            where: { storeId },
            include: {
                variant: {
                    include: {
                        product: {
                            include: { category: true }
                        }
                    }
                }
            }
        });

        const filteredInventory = inventoryItems.filter(item => {
            if (!item.variant) return false;
            if (game && item.variant.product?.game !== game) return false;
            if (category && item.variant.product?.category?.name !== category) return false;
            return true;
        });

        let totalRetailValue = 0;
        let totalCostBasis = 0;
        let lowStockCount = 0;

        for (const item of filteredInventory) {
            const retail = Number(item.variant.price) * item.quantity;
            const cost = Number(item.variant.costPrice || 0) * item.quantity;
            totalRetailValue += retail;
            totalCostBasis += cost;

            const threshold = item.lowStock || 5;
            if (item.quantity < threshold) {
                lowStockCount++;
            }
        }

        const potentialMargin = totalRetailValue > 0 
            ? ((totalRetailValue - totalCostBasis) / totalRetailValue) * 100 
            : 0;

        // Stock turnover rate (Cost of goods sold / average inventory cost basis)
        // For simplicity, we calculate turnover as total COGS sold in the period / current cost basis
        const stockTurnover = totalCostBasis > 0 ? totalCogs / totalCostBasis : 0;

        // Sales velocity map for stockout risk & dead stock
        const itemSalesQtyMap = new Map<string, number>();
        for (const order of filteredOrders) {
            if (order.status === 'CANCELLED' || order.status === 'REFUNDED') continue;
            for (const item of order.items) {
                if (item.variantId) {
                    itemSalesQtyMap.set(item.variantId, (itemSalesQtyMap.get(item.variantId) || 0) + item.quantity);
                }
            }
        }

        const daysInPeriod = Math.max(1, Math.round(periodMs / (24 * 60 * 60 * 1000)));

        const stockoutRisk = filteredInventory.map(item => {
            const qtySold = itemSalesQtyMap.get(item.variantId) || 0;
            const velocity = qtySold / daysInPeriod;
            const daysRemaining = velocity > 0 ? (item.quantity / velocity) : 999;
            return {
                productName: item.variant.product.name,
                sku: item.variant.sku || 'N/A',
                quantity: item.quantity,
                salesVelocity: velocity,
                daysRemaining: Math.round(daysRemaining * 10) / 10
            };
        }).filter(r => r.salesVelocity > 0 && r.daysRemaining < 30)
          .sort((a, b) => a.daysRemaining - b.daysRemaining)
          .slice(0, 10);

        const deadStock = filteredInventory.map(item => {
            const qtySold = itemSalesQtyMap.get(item.variantId) || 0;
            const daysSinceCreated = (Date.now() - new Date(item.variant.createdAt).getTime()) / (24 * 60 * 60 * 1000);
            return {
                productName: item.variant.product.name,
                sku: item.variant.sku || 'N/A',
                quantity: item.quantity,
                value: Number(item.variant.price) * item.quantity,
                daysSinceCreated: Math.round(daysSinceCreated)
            };
        }).filter(r => r.quantity > 5 && (itemSalesQtyMap.get(r.sku) || 0) === 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        // Group inventory by game & category
        const invGameMap = new Map<string, number>();
        const invCategoryMap = new Map<string, number>();
        const conditionCounts = new Map<string, number>();

        for (const item of filteredInventory) {
            const g = item.variant.product?.game || 'Other';
            const c = item.variant.product?.category?.name || 'Uncategorized';
            const cond = item.variant.condition;
            const val = Number(item.variant.price) * item.quantity;

            invGameMap.set(g, (invGameMap.get(g) || 0) + val);
            invCategoryMap.set(c, (invCategoryMap.get(c) || 0) + val);
            conditionCounts.set(cond, (conditionCounts.get(cond) || 0) + item.quantity);
        }

        const inventoryByGame = Array.from(invGameMap.entries()).map(([name, value]) => ({ name, value }));
        const inventoryByCategory = Array.from(invCategoryMap.entries()).map(([name, value]) => ({ name, value }));
        const inventoryByCondition = Array.from(conditionCounts.entries()).map(([name, value]) => ({ name, value }));

        // ==========================================
        // TAB 4: CUSTOMER RETENTION & LTV
        // ==========================================
        const customers = await this.prisma.customer.findMany({ where: { storeId } });
        const totalStoreCredit = customers.reduce((acc, curr) => acc + Number(curr.creditBalance), 0);

        const allStoreOrders = await this.prisma.order.findMany({
            where: { storeId, status: { not: 'CANCELLED' } },
            select: { customerId: true, total: true, createdAt: true }
        });

        const activeCustomerIds = new Set(filteredOrders.map(o => o.customerId).filter(Boolean));
        const activeCustomersCount = activeCustomerIds.size;

        const customerOrderCounts = new Map<string, { count: number; totalSpend: number; lastOrder: Date }>();
        for (const o of allStoreOrders) {
            if (!o.customerId) continue;
            const current = customerOrderCounts.get(o.customerId) || { count: 0, totalSpend: 0, lastOrder: new Date(o.createdAt) };
            current.count += 1;
            current.totalSpend += Number(o.total);
            if (new Date(o.createdAt) > current.lastOrder) {
                current.lastOrder = new Date(o.createdAt);
            }
            customerOrderCounts.set(o.customerId, current);
        }

        const customerDetailsMap = new Map(customers.map(c => [c.id, c]));
        const customerLeaderboard = Array.from(customerOrderCounts.entries()).map(([id, stats]) => {
            const customer = customerDetailsMap.get(id);
            return {
                id,
                name: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : 'Unknown',
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

        const averageLtv = uniqueCustomersWithOrders > 0
            ? allStoreOrders.reduce((sum, o) => sum + Number(o.total), 0) / uniqueCustomersWithOrders
            : 0;

        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const slippingCustomers = customers.map(c => {
            const stats = customerOrderCounts.get(c.id);
            return {
                name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
                email: c.email,
                lastOrderDate: stats?.lastOrder || null,
                ltv: stats?.totalSpend || 0
            };
        }).filter(c => c.lastOrderDate && c.lastOrderDate < sixtyDaysAgo && c.ltv > 50)
          .sort((a, b) => b.ltv - a.ltv)
          .slice(0, 10);

        // ==========================================
        // TAB 5: TCG BUYLIST METRICS
        // ==========================================
        const buylistWhereClause: any = { storeId };
        if (startDate || endDate) {
            buylistWhereClause.createdAt = {};
            if (start) buylistWhereClause.createdAt.gte = start;
            if (end) buylistWhereClause.createdAt.lte = end;
        }

        // @ts-ignore
        const buylists = await this.prisma.buylistOffer.findMany({
            where: buylistWhereClause,
            include: { items: true }
        });

        const completedBuylists = buylists.filter(b => b.status === 'COMPLETED');
        let totalBuylistCash = 0;
        let totalBuylistCredit = 0;
        let totalIntakeValue = 0;

        for (const b of completedBuylists) {
            totalBuylistCash += Number(b.totalCash);
            totalBuylistCredit += Number(b.totalCredit);
            totalIntakeValue += b.items.reduce((sum, i) => sum + (Number(i.imageUrl || i.offerPrice) * i.quantity), 0); 
            // note: if imageUrl was stored, else let's use offerPrice directly to compute intake cost price
            // let's compute intake cost price as totalCash + totalCredit (since that's what we paid)
        }

        const totalPayout = totalBuylistCash + totalBuylistCredit;
        const buylistConversion = buylists.length > 0 ? (completedBuylists.length / buylists.length) * 100 : 0;

        // Funnel Stages count
        const buylistFunnelMap = new Map<string, number>();
        for (const b of buylists) {
            buylistFunnelMap.set(b.status, (buylistFunnelMap.get(b.status) || 0) + 1);
        }
        const buylistFunnel = Array.from(buylistFunnelMap.entries()).map(([name, value]) => ({ name, value }));

        // Daily completed buylist intake trends
        const dailyBuylistMap = new Map<string, number>();
        const bTempDate = new Date(start);
        while (bTempDate <= end) {
            const key = bTempDate.toISOString().split('T')[0];
            dailyBuylistMap.set(key, 0);
            bTempDate.setDate(bTempDate.getDate() + 1);
        }

        for (const b of completedBuylists) {
            const key = new Date(b.createdAt).toISOString().split('T')[0];
            const current = dailyBuylistMap.get(key) || 0;
            dailyBuylistMap.set(key, current + Number(b.totalCash) + Number(b.totalCredit));
        }

        const buylistTrend = Array.from(dailyBuylistMap.entries()).map(([date, value]) => ({
            date,
            value
        })).sort((a, b) => a.date.localeCompare(b.date));

        // ==========================================
        // TAB 6: IN-STORE EVENTS PERFORMANCE
        // ==========================================
        const eventWhereClause: any = { storeId };
        if (startDate || endDate) {
            eventWhereClause.date = {};
            if (start) eventWhereClause.date.gte = start;
            if (end) eventWhereClause.date.lte = end;
        }

        const events = await this.prisma.event.findMany({
            where: eventWhereClause,
            include: { players: true }
        });

        let totalEventRevenue = 0;
        let totalRegistrations = 0;
        let totalMaxCapacity = 0;
        let totalCheckedIn = 0;

        for (const ev of events) {
            totalRegistrations += ev.players.length;
            totalMaxCapacity += ev.maxPlayers || 0;
            totalCheckedIn += ev.players.filter(p => p.checkedIn).length;
            totalEventRevenue += Number(ev.entryFee) * ev.players.length;
        }

        const eventOccupancy = totalMaxCapacity > 0 ? (totalRegistrations / totalMaxCapacity) * 100 : 0;
        const checkInRatio = totalRegistrations > 0 ? (totalCheckedIn / totalRegistrations) * 100 : 0;

        // Attendance by game format
        const eventGameMap = new Map<string, number>();
        for (const ev of events) {
            const g = ev.game || 'TCG';
            eventGameMap.set(g, (eventGameMap.get(g) || 0) + ev.players.length);
        }
        const eventsByGame = Array.from(eventGameMap.entries()).map(([name, value]) => ({ name, value }));

        // Player leaderboard
        const playerEventMap = new Map<string, { name: string; count: number; spent: number }>();
        for (const ev of events) {
            for (const p of ev.players) {
                const email = p.playerEmail || 'Unknown';
                const current = playerEventMap.get(email) || { name: p.playerName, count: 0, spent: 0 };
                current.count += 1;
                current.spent += Number(ev.entryFee);
                playerEventMap.set(email, current);
            }
        }
        const eventPlayerLeaderboard = Array.from(playerEventMap.entries()).map(([email, val]) => ({
            email,
            name: val.name,
            eventsCount: val.count,
            totalSpent: val.spent
        })).sort((a, b) => b.eventsCount - a.eventsCount).slice(0, 10);

        // 5. Build and return consolidated stats payload
        return {
            // Tab 1: Business Overview
            grossRevenue,
            orderVolume,
            aov,
            revenueGrowth,
            salesTrend,
            statusDistribution,
            gameSales,
            categorySales,
            topProducts,

            // Tab 2: Financial Details & COGS
            financialMetrics: {
                totalCogs,
                netProfit,
                grossMargin,
                totalRefundedValue,
                refundRate,
                totalStoreCredit
            },

            // Tab 3: Inventory
            inventoryValuation: {
                retailValue: totalRetailValue,
                costBasis: totalCostBasis,
                grossMargin: potentialMargin,
                stockTurnover,
                lowStockCount
            },
            inventoryMetrics: {
                stockoutRisk,
                deadStock,
                inventoryByGame,
                inventoryByCategory,
                inventoryByCondition
            },

            // Tab 4: Customer Metrics
            customerMetrics: {
                totalStoreCredit,
                repeatCustomerRate,
                customerLeaderboard,
                activeCustomersCount,
                averageLtv,
                slippingCustomers
            },

            // Tab 5: Buylist Metrics
            buylistMetrics: {
                totalCashPayout: totalBuylistCash,
                totalCreditPayout: totalBuylistCredit,
                totalPayout,
                buylistConversion,
                buylistFunnel,
                buylistTrend
            },

            // Tab 6: Event Metrics
            eventMetrics: {
                totalEventRevenue,
                totalRegistrations,
                eventOccupancy,
                checkInRatio,
                eventsByGame,
                eventPlayerLeaderboard
            }
        };
    }
}

