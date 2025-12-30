export declare class TcgPlayerService {
    syncPricing(storeId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
