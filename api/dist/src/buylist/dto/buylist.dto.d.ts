import { Condition, OfferStatus } from '@prisma/client';
export declare class CreateBuylistRuleDto {
    game: string;
    rarity?: string;
    set?: string;
    buyPercentage: number;
}
export declare class BuylistItemDto {
    cardName: string;
    condition: Condition;
    isFoil: boolean;
    offerPrice: number;
    quantity: number;
}
export declare class CreateBuylistOfferDto {
    customerName: string;
    customerEmail: string;
    items: BuylistItemDto[];
}
export declare class UpdateOfferStatusDto {
    status: OfferStatus;
}
