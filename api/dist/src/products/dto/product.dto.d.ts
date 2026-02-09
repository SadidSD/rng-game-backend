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
    categoryId?: string;
    set?: string;
    rarity?: string;
    collectorNumber?: string;
    oracleId?: string;
    oracleText?: string;
    legalities?: any;
    manaCost?: string;
    manaValue?: number;
    colors?: string[];
    colorIdentity?: string[];
    typeLine?: string;
    supertypes?: string[];
    subtypes?: string[];
    power?: string;
    toughness?: string;
    loyalty?: string;
    price?: number;
    images?: string[];
    variants?: CreateProductVariantDto[];
}
declare const UpdateProductVariantDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateProductVariantDto>>;
export declare class UpdateProductVariantDto extends UpdateProductVariantDto_base {
    id?: string;
}
declare const UpdateProductDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateProductDto, "variants">>>;
export declare class UpdateProductDto extends UpdateProductDto_base {
    variants?: UpdateProductVariantDto[];
}
export {};
