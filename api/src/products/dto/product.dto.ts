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
