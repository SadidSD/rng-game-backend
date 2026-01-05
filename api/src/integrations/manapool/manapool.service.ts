import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ManapoolService {
    private readonly baseUrl: string;

    constructor(private configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('MANAPOOL_BASE_URL') || 'https://api.manapool.io/v1';
    }

    async searchCards(query: string, game: string = 'Pokemon') {
        const accessToken = this.configService.get<string>('MANAPOOL_ACCESS_TOKEN');

        if (!accessToken) {
            throw new HttpException('Manapool Access Token not configured', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            // Switching to GET /cards based on standard REST patterns and corrected Base URL.
            // Previous POST /card_info was a guess that returned 401 (likely method not allowed or wrong endpoint).
            const response = await axios.get(`${this.baseUrl}/cards`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    q: query, // Assuming 'q' or 'search' is the standard search param
                    game: game
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Manapool API Error [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`, error.response?.data || error.message);

            throw new HttpException(
                {
                    message: 'Failed to fetch from Manapool',
                    details: error.response?.data || error.message,
                    url: error.config?.url
                },
                error.response?.status || HttpStatus.BAD_GATEWAY
            );
        }
    }
}
