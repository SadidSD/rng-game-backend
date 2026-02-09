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
                description: string | null;
                slug: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
                image: string | null;
            } | null;
            card: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                oracleId: string;
                oracleText: string;
                legalities: import("@prisma/client/runtime/library").JsonValue | null;
                manaCost: string | null;
                manaValue: number | null;
                colors: string[];
                colorIdentity: string[];
                typeLine: string | null;
                supertypes: string[];
                subtypes: string[];
                power: string | null;
                toughness: string | null;
                loyalty: string | null;
            } | null;
            variants: ({
                inventory: {
                    id: string;
                    storeId: string;
                    updatedAt: Date;
                    quantity: number;
                    lowStock: number;
                    location: string | null;
                    variantId: string;
                } | null;
            } & {
                id: string;
                price: import("@prisma/client/runtime/library").Decimal;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
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
            description: string | null;
            categoryId: string | null;
            price: import("@prisma/client/runtime/library").Decimal | null;
            game: string | null;
            set: string | null;
            rarity: string | null;
            collectorNumber: string | null;
            cardId: string | null;
            slug: string;
            storeId: string;
            tags: string[];
            images: string[];
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    getProduct(req: any, id: string): Promise<({
        category: {
            id: string;
            name: string;
            description: string | null;
            slug: string;
            storeId: string;
            createdAt: Date;
            updatedAt: Date;
            image: string | null;
        } | null;
        card: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            oracleId: string;
            oracleText: string;
            legalities: import("@prisma/client/runtime/library").JsonValue | null;
            manaCost: string | null;
            manaValue: number | null;
            colors: string[];
            colorIdentity: string[];
            typeLine: string | null;
            supertypes: string[];
            subtypes: string[];
            power: string | null;
            toughness: string | null;
            loyalty: string | null;
        } | null;
        variants: ({
            inventory: {
                id: string;
                storeId: string;
                updatedAt: Date;
                quantity: number;
                lowStock: number;
                location: string | null;
                variantId: string;
            } | null;
        } & {
            id: string;
            price: import("@prisma/client/runtime/library").Decimal;
            storeId: string;
            createdAt: Date;
            updatedAt: Date;
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
        description: string | null;
        categoryId: string | null;
        price: import("@prisma/client/runtime/library").Decimal | null;
        game: string | null;
        set: string | null;
        rarity: string | null;
        collectorNumber: string | null;
        cardId: string | null;
        slug: string;
        storeId: string;
        tags: string[];
        images: string[];
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
}
