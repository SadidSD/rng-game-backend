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

            // Using select to minimize data transfer but including all essential metadata
            const url = `${this.baseUrl}/cards?q=${encodeURIComponent(luceneQuery)}&pageSize=15&select=id,name,images,set,rarity,tcgplayer,cardmarket,abilities,attacks,rules,supertype,subtypes,types,number`;
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
                    price: card.cardmarket?.prices?.averageSellPrice,

                    // Extended Metadata for Card Identity
                    abilities: card.abilities || [],
                    attacks: card.attacks || [],
                    rules: card.rules || [],
                    supertype: card.supertype,
                    subtypes: card.subtypes || [],
                    types: card.types || []
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

    async getCardByDetails(name: string, set?: string, collectorNumber?: string) {
        const apiKey = this.configService.get<string>('POKEMON_TCG_API_KEY');
        
        let queryParts: string[] = [];
        if (name) {
            queryParts.push(`name:"${name.replace(/[":]/g, '')}"`);
        }
        if (set) {
            const cleanSet = set.replace(/[":]/g, '').trim();
            // If set looks like set ID (contains - or short code like det1), search set.id. Otherwise search set.name
            if (cleanSet.toLowerCase().startsWith('det') || cleanSet.includes('-') || cleanSet.length <= 4) {
                queryParts.push(`set.id:${cleanSet}`);
            } else {
                queryParts.push(`set.name:"${cleanSet}"`);
            }
        }
        if (collectorNumber) {
            queryParts.push(`number:${collectorNumber.trim()}`);
        }

        const q = queryParts.join(' ');
        const url = `${this.baseUrl}/cards?q=${encodeURIComponent(q)}&pageSize=1&select=id,name,images,set,rarity,tcgplayer,cardmarket,number`;

        try {
            console.log(`[PokemonTCG] Detailed search query: ${q}`);
            const headers: any = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (apiKey) {
                headers['X-Api-Key'] = apiKey;
            }

            const response = await axios.get(url, {
                headers,
                timeout: 30000,
                httpsAgent: this.httpsAgent
            });

            const cards = response.data.data || [];
            if (cards.length > 0) {
                const card = cards[0];
                return {
                    id: card.id,
                    name: card.name,
                    set: card.set.name,
                    setId: card.set.id,
                    number: card.number,
                    rarity: card.rarity,
                    image: card.images.small,
                    imageLarge: card.images.large,
                    tcgplayerUrl: card.tcgplayer?.url,
                    price: card.cardmarket?.prices?.averageSellPrice || card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0
                };
            }
            return null;
        } catch (error: any) {
            console.warn(`[PokemonTCG] Error fetching card by details query "${q}":`, error.response?.data || error.message);
            // Fallback: search fuzzy name
            if (name) {
                const searchRes = await this.searchCards(name);
                if (searchRes.data && searchRes.data.length > 0) {
                    return searchRes.data[0];
                }
            }
            return null;
        }
    }
}
