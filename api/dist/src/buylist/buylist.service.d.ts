import { PrismaService } from '../prisma/prisma.service';
import { CreateBuylistRuleDto, CreateBuylistOfferDto, UpdateOfferStatusDto } from './dto/buylist.dto';
export declare class BuylistService {
    private prisma;
    constructor(prisma: PrismaService);
    createRule(storeId: string, dto: CreateBuylistRuleDto): Promise<{
        id: string;
        createdAt: Date;
        storeId: string;
        game: string;
        set: string | null;
        rarity: string | null;
        buyPercentage: import("@prisma/client/runtime/library").Decimal;
    }>;
    getRules(storeId: string): Promise<{
        id: string;
        createdAt: Date;
        storeId: string;
        game: string;
        set: string | null;
        rarity: string | null;
        buyPercentage: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    submitOffer(storeId: string, dto: CreateBuylistOfferDto): Promise<{
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
    getOffers(storeId: string): Promise<({
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
    updateOfferStatus(storeId: string, offerId: string, dto: UpdateOfferStatusDto): Promise<{
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
