import { BuylistService } from './buylist.service';
import { CreateBuylistRuleDto, CreateBuylistOfferDto, UpdateOfferStatusDto } from './dto/buylist.dto';
export declare class BuylistController {
    private readonly buylistService;
    constructor(buylistService: BuylistService);
    createRule(req: any, dto: CreateBuylistRuleDto): Promise<{
        id: string;
        game: string;
        set: string | null;
        rarity: string | null;
        storeId: string;
        createdAt: Date;
        buyPercentage: import("@prisma/client/runtime/library").Decimal;
    }>;
    getRules(req: any): Promise<{
        id: string;
        game: string;
        set: string | null;
        rarity: string | null;
        storeId: string;
        createdAt: Date;
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
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OfferStatus;
        customerName: string;
        customerEmail: string;
        totalCash: import("@prisma/client/runtime/library").Decimal;
        totalCredit: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    updateOffer(req: any, id: string, dto: UpdateOfferStatusDto): Promise<{
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
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OfferStatus;
        customerName: string;
        customerEmail: string;
        totalCash: import("@prisma/client/runtime/library").Decimal;
        totalCredit: import("@prisma/client/runtime/library").Decimal;
    }>;
    getFeaturedCards(req: any): Promise<{
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
    search(req: any, query: string): Promise<{
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
}
