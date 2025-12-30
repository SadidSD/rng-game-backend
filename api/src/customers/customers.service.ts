import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customers.dto';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) { }

    async create(storeId: string, dto: CreateCustomerDto) {
        return this.prisma.customer.create({
            data: {
                ...dto,
                storeId,
            },
        });
    }

    async findAll(storeId: string, search?: string) {
        const where: any = { storeId };

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

    async findOne(storeId: string, id: string) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, storeId },
            include: {
                orders: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!customer) throw new NotFoundException('Customer not found');
        return customer;
    }

    async update(storeId: string, id: string, dto: UpdateCustomerDto) {
        const customer = await this.prisma.customer.findFirst({ where: { id, storeId } });
        if (!customer) throw new NotFoundException('Customer not found');

        return this.prisma.customer.update({
            where: { id },
            data: dto,
        });
    }
}
