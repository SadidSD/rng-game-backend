import { ConfigService } from '@nestjs/config';
export declare class ManapoolService {
    private configService;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    searchCards(query: string, game?: string): Promise<any>;
}
