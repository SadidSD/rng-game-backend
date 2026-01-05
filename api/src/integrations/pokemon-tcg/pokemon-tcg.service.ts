import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PokemonTcgService {
    private readonly baseUrl = 'https://api.pokemontcg.io/v2';

    constructor(private configService: ConfigService) { }

    async searchCards(query: string) {
        const apiKey = this.configService.get<string>('POKEMON_TCG_API_KEY');
        // API Key is optional but recommended. We log a warning if missing but proceed.
        if (!apiKey) {
            console.warn('POKEMON_TCG_API_KEY is not set. Rate limits will be restricted.');
        }

        try {
            // Documented syntax: q=name:charizard*
            // We use quotes to handle names with spaces and * for prefix matching
            const luceneQuery = `name:"${query}"*`;

            const response = await axios.get(`${this.baseUrl}/cards`, {
                headers: apiKey ? { 'X-Api-Key': apiKey } : {},
                params: {
                    q: luceneQuery,
                    pageSize: 20 // Limit results for performance
                }
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
