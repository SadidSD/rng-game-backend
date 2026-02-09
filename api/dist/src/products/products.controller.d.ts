import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(req: any, createProductDto: CreateProductDto): Promise<{
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
    }>;
    findAll(req: any, query: {
        game?: string;
        search?: string;
    }): Promise<{
        totalSales: number;
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
    }[]>;
    findOne(req: any, id: string): Promise<{
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
    }>;
    update(req: any, id: string, updateProductDto: UpdateProductDto): Promise<{
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
    }>;
    remove(req: any, id: string): Promise<{
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
    }>;
}
