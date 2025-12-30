export declare class EbayService {
    syncInventory(storeId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    importOrders(storeId: string): Promise<{
        success: boolean;
        count: number;
    }>;
}
