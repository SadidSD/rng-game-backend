"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats(storeId) {
        const salesAgg = await this.prisma.order.aggregate({
            where: { storeId, status: { not: 'CANCELLED' } },
            _sum: { total: true },
            _count: { id: true }
        });
        const customerCount = await this.prisma.customer.count({
            where: { storeId }
        });
        const productCount = await this.prisma.product.count({
            where: { storeId }
        });
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
        const buylistCount = await this.prisma.buylistOffer.count({
            where: { storeId, status: 'PENDING' }
        });
        const recentOrders = await this.prisma.order.findMany({
            where: { storeId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });
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
    aggregateSalesByDay(orders) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const map = new Map();
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map