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
        // Scryfall search: return a list of matches (capped at 20 for search results speed)
        const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}`;

        try {
            console.log(`[Scryfall] Searching query: ${query}`);
            const response = await axios.get(url, {
                httpsAgent: this.httpsAgent,
                timeout: 10000
            });

            const cards = response.data.data || [];
            return cards.slice(0, 20).map((c: any) => this.normalizeCard(c));
        } catch (error) {
            console.error(`[Scryfall] Error searching query "${query}":`, error.message);
            return [];
        }
    }
}
