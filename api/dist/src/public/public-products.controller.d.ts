import { PrismaService } from '../prisma/prisma.service';
export declare class PublicProductsController {
    private prisma;
    constructor(prisma: PrismaService);
    getProducts(req: any): Promise<{
        store: any;
        count: number;
        data: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                description: string | null;
                slug: string;
                image: string | null;
            } | null;
            variants: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                sku: string | null;
                productId: string;
                condition: import(".prisma/client").$Enums.Condition;
                isFoil: boolean;
                language: string;
                costPrice: import("@prisma/client/runtime/library").Decimal | null;
                salePrice: import("@prisma/client/runtime/library").Decimal | null;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            description: string | null;
            categoryId: string | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            game: string | null;
            set: string | null;
            rarity: string | null;
            collectorNumber: string | null;
            cardId: string | null;
            slug: string;
            tags: string[];
            images: string[];
        })[];
    }>;
    getProduct(req: any, id: string): Promise<({
        card: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            oracleId: string;
            oracleText: string | null;
            legalities: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            description: string | null;
            slug: string;
            image: string | null;
        } | null;
        variants: ({
            inventory: {
                id: string;
                updatedAt: Date;
                storeId: string;
                quantity: number;
                lowStock: number;
                location: string | null;
                variantId: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sku: string | null;
            productId: string;
            condition: import(".prisma/client").$Enums.Condition;
            isFoil: boolean;
            language: string;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            salePrice: import("@prisma/client/runtime/library").Decimal | null;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        description: string | null;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
        game: string | null;
        set: string | null;
        rarity: string | null;
        collectorNumber: string | null;
        cardId: string | null;
        slug: string;
        tags: string[];
        images: string[];
    }) | null>;
}
