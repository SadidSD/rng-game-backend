import { StoreService } from './store.service';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
    generateApiKey(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        apiKey: string;
    }>;
    getStore(req: any): Promise<({
        users: {
            email: string;
            password: string;
            id: string;
            role: import(".prisma/client").$Enums.Role;
            storeId: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        apiKey: string;
    }) | null>;
}
