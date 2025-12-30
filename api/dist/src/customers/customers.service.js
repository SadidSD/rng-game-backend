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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(storeId, dto) {
        return this.prisma.customer.create({
            data: {
                ...dto,
                storeId,
            },
        });
    }
    async findAll(storeId, search) {
        const where = { storeId };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { orders: true } } }
        });
    }
    async findOne(storeId, id) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, storeId },
            include: {
                orders: { orderBy: { createdAt: 'desc' } }
            }
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return customer;
    }
    async update(storeId, id, dto) {
        const customer = await this.prisma.customer.findFirst({ where: { id, storeId } });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return this.prisma.customer.update({
            where: { id },
            data: dto,
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map