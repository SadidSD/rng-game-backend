import { PrismaService } from '../prisma/prisma.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getInventory(storeId: string, variantId: string): Promise<{
        id: string;
        storeId: string;
        updatedAt: Date;
        quantity: number;
        lowStock: number;
        location: string | null;
        variantId: string;
    } | null>;
    updateInventory(storeId: string, variantId: string, dto: UpdateInventoryDto): Promise<{
        id: string;
        storeId: string;
        updatedAt: Date;
        quantity: number;
        lowStock: number;
        location: string | null;
        variantId: string;
    }>;
}
