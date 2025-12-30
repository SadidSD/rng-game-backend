import { BuylistService } from './buylist.service';
import { CreateBuylistRuleDto, CreateBuylistOfferDto, UpdateOfferStatusDto } from './dto/buylist.dto';
export declare class BuylistController {
    private readonly buylistService;
    constructor(buylistService: BuylistService);
    createRule(req: any, dto: CreateBuylistRuleDto): Promise<{
        id: string;
        createdAt: Date;
        storeId: string;
        game: string;
        set: string | null;
        rarity: string | null;
        buyPercentage: import("@prisma/client/runtime/library").Decimal;
    }>;
    getRules(req: any): Promise<{
        id: string;
        createdAt: Date;
        storeId: string;
        game: string;
        set: string | null;
        rarity: string | null;
        buyPercentage: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getOffers(req: any): Promise<({
        items: {
            id: string;
            condition: import(".prisma/client").$Enums.Condition;
            isFoil: boolean;
            quantity: number;
            cardName: string;
            offerPrice: import("@prisma/client/runtime/library").Decimal;
            offerId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerName: string;
        customerEmail: string;
        status: import(".prisma/client").$Enums.OfferStatus;
        totalCash: import("@prisma/client/runtime/library").Decimal;
        totalCredit: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    updateOffer(req: any, id: string, dto: UpdateOfferStatusDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerName: string;
        customerEmail: string;
        status: import(".prisma/client").$Enums.OfferStatus;
        totalCash: import("@prisma/client/runtime/library").Decimal;
        totalCredit: import("@prisma/client/runtime/library").Decimal;
    }>;
    submitOffer(req: any, dto: CreateBuylistOfferDto): Promise<{
        items: {
            id: string;
            condition: import(".prisma/client").$Enums.Condition;
            isFoil: boolean;
            quantity: number;
            cardName: string;
            offerPrice: import("@prisma/client/runtime/library").Decimal;
            offerId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerName: string;
        customerEmail: string;
        status: import(".prisma/client").$Enums.OfferStatus;
        totalCash: import("@prisma/client/runtime/library").Decimal;
        totalCredit: import("@prisma/client/runtime/library").Decimal;
    }>;
}
