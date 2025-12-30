import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findOne(req: any, variantId: string): Promise<{
        id: string;
        updatedAt: Date;
        storeId: string;
        quantity: number;
        lowStock: number;
        location: string | null;
        variantId: string;
    } | null>;
    update(req: any, variantId: string, dto: UpdateInventoryDto): Promise<{
        id: string;
        updatedAt: Date;
        storeId: string;
        quantity: number;
        lowStock: number;
        location: string | null;
        variantId: string;
    }>;
}
