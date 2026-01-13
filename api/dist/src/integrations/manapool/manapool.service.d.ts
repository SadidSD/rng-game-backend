import { ConfigService } from '@nestjs/config';
export declare class ManapoolService {
    private configService;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    private priceCache;
    private readonly CACHE_TTL;
    searchCards(query: string, game?: string): Promise<{
        data: any[];
    }>;
    private getAllPrices;
}
