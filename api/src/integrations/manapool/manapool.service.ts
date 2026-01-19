
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ManapoolService {
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        // [FORCE FIX] Ignoring MANAPOOL_BASE_URL env var.
        // Using manapool.com (Confirmed working domain)
        this.baseUrl = 'https://manapool.com/api/v1';
        // this.configService.get<string>('MANAPOOL_BASE_URL') || 'https://manapool.com/api/v1';
    }

    private priceCache: { data: any[], timestamp: number } | null = null;
    private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour (Increased from 5m to reduce loading times)

    async searchCards(query: string, game: string = 'Pokemon') {
        const prices = await this.getAllPrices();

        // Filter locally since the API provides a bulk dump
        const lowerQuery = query.toLowerCase();
        return {
            data: prices.filter(card =>
                card.name.toLowerCase().includes(lowerQuery) ||
                (card.scryfall_id && card.scryfall_id === query) // Support ID lookup
            ).map(card => ({
                ...card,
                // Normalize fields for frontend consistency
                price: card.price_cents / 100, // Non-Foil
                price_foil: card.price_cents_foil ? card.price_cents_foil / 100 : null,
                price_etched: card.price_cents_etch ? card.price_cents_etch / 100 : null,
                marketPrice: card.price_cents / 100,
                currency: 'USD',
                // Raw data pass-through if needed
                raw_data: card
            }))
        };
    }

    private async getAllPrices() {
        if (this.priceCache && (Date.now() - this.priceCache.timestamp < this.CACHE_TTL)) {
            return this.priceCache.data;
        }

        const accessToken = this.configService.get<string>('MANAPOOL_ACCESS_TOKEN');
        console.log(`[Manapool] Token available: ${accessToken ? 'YES' : 'NO'} (${accessToken ? accessToken.substring(0, 5) + '...' : ''})`);

        if (!accessToken) throw new HttpException('Manapool Token Missing in Environment', HttpStatus.INTERNAL_SERVER_ERROR);

        try {
            console.log(`[Manapool] Fetching prices from ${this.baseUrl}/prices/singles...`);
            // GET /prices/singles returns all in-stock singles
            const response = await axios.get(`${this.baseUrl}/prices/singles`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            this.priceCache = {
                data: response.data.data || [],
                timestamp: Date.now()
            };
            console.log(`[Manapool] Fetched ${this.priceCache.data.length} prices.`);
            return this.priceCache.data;
        } catch (error: any) {
            console.error('Manapool Price Fetch Error FULL:', error);
            // Return actual cause to client for debugging
            const cause = error.response?.data?.message || error.message;
            throw new HttpException(`Failed to fetch Manapool prices: ${cause}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
