import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested
} from 'class-validator';
import { Condition } from '@prisma/client';

export class CreateProductVariantDto {
    @IsEnum(Condition)
    condition: Condition;

    @IsBoolean()
    @IsOptional()
    isFoil?: boolean;

    @IsString()
    @IsOptional()
    language?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(0)
    quantity: number;
}

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    game: string; // Pokemon, MTG

    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsOptional()
    set?: string;

    @IsString()
    @IsOptional()
    rarity?: string;

    @IsString()
    @IsOptional()
    collectorNumber?: string;

    @IsString()
    @IsOptional()
    oracleId?: string;

    @IsString()
    @IsOptional()
    oracleText?: string;

    @IsOptional()
    legalities?: any; // JSON object from Scryfall

    // Advanced Filtering
    @IsString()
    @IsOptional()
    manaCost?: string;

    @IsNumber()
    @IsOptional()
    manaValue?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    colors?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    colorIdentity?: string[];

    @IsString()
    @IsOptional()
    typeLine?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    supertypes?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    subtypes?: string[];

    @IsString()
    @IsOptional()
    power?: string;

    @IsString()
    @IsOptional()
    toughness?: string;

    @IsString()
    @IsOptional()
    loyalty?: string;


    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number; // Base display price

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductVariantDto)
    @IsOptional()
    variants?: CreateProductVariantDto[];
}

import { PartialType, OmitType } from '@nestjs/mapped-types';

export class UpdateProductVariantDto extends PartialType(CreateProductVariantDto) {
    @IsString()
    @IsOptional()
    id?: string;
}

export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['variants'] as const)) {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateProductVariantDto)
    @IsOptional()
    variants?: UpdateProductVariantDto[];
}
