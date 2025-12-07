import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StoreService {
    constructor(private prisma: PrismaService) { }

    async generateApiKey(storeId: string) {
        const newApiKey = uuidv4();
        return this.prisma.store.update({
            where: { id: storeId },
            data: { apiKey: newApiKey },
        });
    }

    async getStore(storeId: string) {
        return this.prisma.store.findUnique({
            where: { id: storeId },
            include: { users: true },
        });
    }
}
