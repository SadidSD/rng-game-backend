import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(storeId: string): Promise<{
        email: string;
        password: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, storeId: string): Promise<{
        email: string;
        password: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
