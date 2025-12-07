import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(req: any): Promise<{
        email: string;
        password: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, req: any): Promise<{
        email: string;
        password: string;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
