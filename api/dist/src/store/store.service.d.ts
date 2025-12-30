import { PrismaService } from '../prisma/prisma.service';
import { UpdateStoreDto } from './dto/store.dto';
export declare class StoreService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<{
        id: string;
        apiKey: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        id: string;
        apiKey: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
