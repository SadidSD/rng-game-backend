import { ConfigService } from '@nestjs/config';
export declare class PokemonTcgService {
    private configService;
    private readonly baseUrl;
    private readonly httpsAgent;
    constructor(configService: ConfigService);
    searchCards(query: string): Promise<{
        data: any;
    }>;
}
