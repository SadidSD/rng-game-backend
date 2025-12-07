import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(storeId: string) {
        return this.prisma.user.findMany({
            where: { storeId },
        });
    }

    async findOne(id: string, storeId: string) {
        return this.prisma.user.findFirst({
            where: { id, storeId },
        });
    }
}
