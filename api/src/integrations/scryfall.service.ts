import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';

@Injectable()
export class ScryfallService {
    private readonly baseUrl = 'https://api.scryfall.com';
    private readonly httpsAgent = new https.Agent({ keepAlive: true });

    async searchCardByName(name: string) {
        // Use 'fuzzy' search to be more forgiving, or 'exact' if strict.
        // Scryfall recommends 100ms delay between requests.
        const url = `${this.baseUrl}/cards/named?fuzzy=${encodeURIComponent(name)}`;

        try {
            console.log(`[Scryfall] Fetching: ${name}`);
            const response = await axios.get(url, {
                httpsAgent: this.httpsAgent,
                timeout: 10000
            });

            const card = response.data;

            // Normalize data to our internal format
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
                price: card.prices?.usd || 0,

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
        } catch (error) {
            console.error(`[Scryfall] Error fetching ${name}:`, error.message);
            return null; // Return null to allow skipping without crashing
        }
    }
}
