import { PrismaService } from '../prisma/prisma.service';
import { UpdateStoreDto } from './dto/store.dto';
export declare class StoreService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
    }>;
    update(id: string, dto: UpdateStoreDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
    }>;
}
