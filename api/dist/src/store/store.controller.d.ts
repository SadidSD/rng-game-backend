import { StoreService } from './store.service';
import { UpdateStoreDto } from './dto/store.dto';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
    getSettings(req: any): Promise<{
        id: string;
        apiKey: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateSettings(req: any, dto: UpdateStoreDto): Promise<{
        id: string;
        apiKey: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
