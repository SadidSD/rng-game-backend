import { PrismaService } from '../prisma/prisma.service';
export declare class StoreService {
    private prisma;
    constructor(prisma: PrismaService);
    generateApiKey(storeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        apiKey: string;
    }>;
    getStore(storeId: string): Promise<({
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
