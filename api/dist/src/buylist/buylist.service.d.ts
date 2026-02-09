import { PrismaService } from '../prisma/prisma.service';
import { CreateBuylistRuleDto, CreateBuylistOfferDto, UpdateOfferStatusDto } from './dto/buylist.dto';
export declare class BuylistService {
    private prisma;
    constructor(prisma: PrismaService);
    createRule(storeId: string, dto: CreateBuylistRuleDto): Promise<{
        id: string;
        game: string;
        set: string | null;
        rarity: string | null;
        storeId: string;
        createdAt: Date;
        buyPercentage: import("@prisma/client/runtime/library").Decimal;
    }>;
    getRules(storeId: string): Promise<{
        id: string;
        game: string;
        set: string | null;
        rarity: string | null;
        storeId: string;
        createdAt: Date;
        buyPercentage: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getFeaturedCards(storeId: string): Promise<{
        id: string;
        name: string;
        game: string;
        set: string | null;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        image: string;
        setId: string | null;
        basePrice: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    searchBuylist(storeId: string, query: string): Promise<{
        source: string;
        local: {
            id: string;
            name: string;
            game: string;
            set: string | null;
            storeId: string;
            createdAt: Date;
            updatedAt: Date;
            image: string;
            setId: string | null;
            basePrice: import("@prisma/client/runtime/library").Decimal | null;
        }[];
        remote: never[];
    }>;
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
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OfferStatus;
        customerName: string;
        customerEmail: string;
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
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OfferStatus;
        customerName: string;
        customerEmail: string;
        totalCash: import("@prisma/client/runtime/library").Decimal;
        totalCredit: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    updateOfferStatus(storeId: string, offerId: string, dto: UpdateOfferStatusDto): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OfferStatus;
        customerName: string;
        customerEmail: string;
        totalCash: import("@prisma/client/runtime/library").Decimal;
        totalCredit: import("@prisma/client/runtime/library").Decimal;
    }>;
    finalizeOfferCredit(storeId: string, offer: any): Promise<void>;
}
