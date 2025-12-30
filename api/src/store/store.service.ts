import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoreService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        const store = await this.prisma.store.findUnique({
            where: { id },
        });
        if (!store) throw new NotFoundException('Store not found');
        return store;
    }

    async update(id: string, dto: UpdateStoreDto) {
        return this.prisma.store.update({
            where: { id },
            data: {
                name: dto.name
            }
        });
    }
}
