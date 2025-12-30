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
    ValidateNested,
    IsEmail
} from 'class-validator';
import { Condition, OfferStatus } from '@prisma/client';

export class CreateBuylistRuleDto {
    @IsString()
    @IsNotEmpty()
    game: string;

    @IsString()
    @IsOptional()
    rarity?: string;

    @IsString()
    @IsOptional()
    set?: string;

    @IsNumber()
    @Min(0)
    buyPercentage: number;
}

export class BuylistItemDto {
    @IsString()
    @IsNotEmpty()
    cardName: string;

    @IsEnum(Condition)
    condition: Condition;

    @IsBoolean()
    isFoil: boolean;

    @IsNumber()
    @Min(0)
    offerPrice: number;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreateBuylistOfferDto {
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @IsEmail()
    customerEmail: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BuylistItemDto)
    items: BuylistItemDto[];
}

export class UpdateOfferStatusDto {
    @IsEnum(OfferStatus)
    status: OfferStatus;
}
