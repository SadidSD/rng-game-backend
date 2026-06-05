import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class ScryfallService {
    private readonly baseUrl = 'https://api.scryfall.com';
    private readonly httpsAgent = new https.Agent({ keepAlive: true });

    private normalizeCard(card: any) {
        return {
            id: card.id,
            name: card.name,
            set: card.set_name,
            setId: card.set,
            image: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '',
            rarity: card.rarity,
            oracleId: card.oracle_id,
            oracleText: card.oracle_text,
            legalities: card.legalities,
            tcgplayerUrl: card.purchase_uris?.tcgplayer,
            price: Number(card.prices?.usd || card.prices?.usd_foil || 0),
            collectorNumber: card.collector_number,

            // Advanced Filtering
            manaCost: card.mana_cost,
            manaValue: card.cmc,
            colors: card.colors || [],
            colorIdentity: card.color_identity || [],
            typeLine: card.type_line,
            power: card.power,
            toughness: card.toughness,
            loyalty: card.loyalty,
            supertypes: [], // Placeholder
            subtypes: []    // Placeholder
        };
    }

    async searchCardByName(name: string) {
        // Use 'fuzzy' search to be more forgiving
        const url = `${this.baseUrl}/cards/named?fuzzy=${encodeURIComponent(name)}`;

        try {
            console.log(`[Scryfall] Fetching by name: ${name}`);
            const response = await axios.get(url, {
                httpsAgent: this.httpsAgent,
                timeout: 10000
            });

            return this.normalizeCard(response.data);
        } catch (error) {
            console.error(`[Scryfall] Error fetching named card "${name}":`, error.message);
            return null;
        }
    }

    async searchCards(query: string) {
        const cleanQuery = (query || '').replace(/"/g, '').trim();
        if (!cleanQuery) {
            return [];
        }
        // Scryfall search: return a list of matches including all prints (capped at 50)
        // We wrap in name:"..." to search names only and prevent rules text/type line false positives
        const url = `${this.baseUrl}/cards/search?q=name:${encodeURIComponent('"' + cleanQuery + '"')}&unique=prints`;

        try {
            console.log(`[Scryfall] Searching query: ${query}`);
            const response = await axios.get(url, {
                httpsAgent: this.httpsAgent,
                timeout: 10000
            });

            const cards = response.data.data || [];

            // Sort cards to prioritize exact name matches first, then direct substring matches
            cards.sort((a: any, b: any) => {
                const aName = (a.name || '').toLowerCase();
                const bName = (b.name || '').toLowerCase();
                const cleanQuery = query.toLowerCase().trim();

                const aExact = aName === cleanQuery;
                const bExact = bName === cleanQuery;

                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                const aContains = aName.includes(cleanQuery);
                const bContains = bName.includes(cleanQuery);

                if (aContains && !bContains) return -1;
                if (!aContains && bContains) return 1;

                const aDiff = Math.abs(aName.length - cleanQuery.length);
                const bDiff = Math.abs(bName.length - cleanQuery.length);
                if (aDiff !== bDiff) {
                    return aDiff - bDiff;
                }

                return aName.localeCompare(bName);
            });

            return cards.slice(0, 50).map((c: any) => this.normalizeCard(c));
        } catch (error) {
            console.error(`[Scryfall] Error searching query "${query}":`, error.message);
            return [];
        }
    }

    async getCardByDetails(name: string, set?: string, collectorNumber?: string) {
        let queryParts: string[] = [];
        
        if (name) {
            // Remove quotes to avoid malformed query syntax
            queryParts.push(`name:"${name.replace(/"/g, '')}"`);
        }
        
        if (set) {
            const cleanSet = set.replace(/"/g, '').trim();
            // If set code is 3-5 chars, treat as code, otherwise search as exact set name
            if (cleanSet.length >= 3 && cleanSet.length <= 5) {
                queryParts.push(`set:${cleanSet}`);
            } else {
                queryParts.push(`e:"${cleanSet}"`);
            }
        }
        
        if (collectorNumber) {
            queryParts.push(`cn:${collectorNumber.trim()}`);
        }

        const q = queryParts.join(' ');
        const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(q)}&unique=prints`;

        try {
            console.log(`[Scryfall] Detailed search query: ${q}`);
            const response = await axios.get(url, {
                httpsAgent: this.httpsAgent,
                timeout: 10000
            });
            const cards = response.data.data || [];
            if (cards.length > 0) {
                return this.normalizeCard(cards[0]);
            }
            return null;
        } catch (error: any) {
            console.warn(`[Scryfall] Error fetching card by details query "${q}":`, error.message);
            // Fallback: search fuzzy by name
            if (name) {
                return this.searchCardByName(name);
            }
            return null;
        }
    }
}
