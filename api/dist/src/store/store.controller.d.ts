import { StoreService } from './store.service';
import { UpdateStoreDto } from './dto/store.dto';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
    getSettings(req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
    }>;
    updateSettings(req: any, dto: UpdateStoreDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        apiKey: string;
    }>;
}
