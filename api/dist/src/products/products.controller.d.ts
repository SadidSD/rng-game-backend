import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(req: any, createProductDto: CreateProductDto): Promise<{
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
            condition: import(".prisma/client").$Enums.Condition;
            isFoil: boolean;
            language: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            salePrice: import("@prisma/client/runtime/library").Decimal | null;
            productId: string;
        })[];
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
    }>;
    findAll(req: any, query: {
        game?: string;
        search?: string;
    }): Promise<({
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
    })[]>;
    findOne(req: any, id: string): Promise<{
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
            condition: import(".prisma/client").$Enums.Condition;
            isFoil: boolean;
            language: string;
            price: import("@prisma/client/runtime/library").Decimal;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            salePrice: import("@prisma/client/runtime/library").Decimal | null;
            productId: string;
        })[];
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
    }>;
}
