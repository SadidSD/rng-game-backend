import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class PokemonTcgService {
    private readonly baseUrl = 'https://api.pokemontcg.io/v2';
    private readonly httpsAgent = new https.Agent({ family: 4 }); // Force IPv4 to avoid timeouts

    constructor(private configService: ConfigService) { }

    async searchCards(query: string) {
        const apiKey = this.configService.get<string>('POKEMON_TCG_API_KEY');
        // ... (check log)

        try {
            // ... (query construction)
            const hasSpaces = query.includes(' ');
            const sanitizedQuery = query.replace(/[":]/g, '');
            const luceneQuery = hasSpaces
                ? `name:"${sanitizedQuery}"`
                : `name:${sanitizedQuery}*`;

            const headers: any = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (apiKey) {
                headers['X-Api-Key'] = apiKey;
            }

            // Using select to minimize data transfer
            const url = `${this.baseUrl}/cards?q=${encodeURIComponent(luceneQuery)}&pageSize=15&select=id,name,images,set,rarity,tcgplayer,cardmarket`;
            console.log(`PokemonTCG Request: ${url}`);

            const response = await axios.get(url, {
                headers,
                timeout: 30000,
                httpsAgent: this.httpsAgent
            });

            // Map the response to a cleaner internal format
            return {
                data: response.data.data.map(card => ({
                    id: card.id,
                    name: card.name,
                    set: card.set.name,
                    setId: card.set.id,
                    number: card.number,
                    rarity: card.rarity,
                    image: card.images.small,
                    imageLarge: card.images.large,
                    tcgplayerUrl: card.tcgplayer?.url,
                    price: card.cardmarket?.prices?.averageSellPrice // simplified price/market data
                }))
            };
        } catch (error) {
            console.error(`PokemonTCG API Error [${error.config?.url}]:`, error.response?.data || error.message);
            throw new HttpException(
                {
                    message: 'Failed to fetch from PokemonTCG API',
                    details: error.response?.data || error.message
                },
                error.response?.status || HttpStatus.BAD_GATEWAY
            );
        }
    }
}
