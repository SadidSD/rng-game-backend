import { Condition } from '@prisma/client';
export declare class CreateProductVariantDto {
    condition: Condition;
    isFoil?: boolean;
    language?: string;
    price: number;
    quantity: number;
}
export declare class CreateProductDto {
    name: string;
    description?: string;
    game: string;
    set?: string;
    images?: string[];
    variants?: CreateProductVariantDto[];
}
