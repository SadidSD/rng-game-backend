import { PrismaService } from '../prisma/prisma.service';
export declare class PublicProductsController {
    private prisma;
    constructor(prisma: PrismaService);
    getProducts(req: any): Promise<{
        store: any;
        count: number;
        data: ({
            variants: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                condition: import(".prisma/client").$Enums.Condition;
                isFoil: boolean;
                language: string;
                price: import("@prisma/client/runtime/library").Decimal;
                sku: string | null;
                costPrice: import("@prisma/client/runtime/library").Decimal | null;
                salePrice: import("@prisma/client/runtime/library").Decimal | null;
                productId: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            description: string | null;
            categoryId: string | null;
            game: string;
            set: string | null;
            slug: string;
            tags: string[];
            images: string[];
        })[];
    }>;
}
