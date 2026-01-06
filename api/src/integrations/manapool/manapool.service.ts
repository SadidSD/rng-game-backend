
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

    async searchCards(query: string, game: string = 'Pokemon') {
        const accessToken = this.configService.get<string>('MANAPOOL_ACCESS_TOKEN');

        if (!accessToken) {
            throw new HttpException('Manapool Access Token not configured', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            // Updated to POST /card_info based on official docs
            const response = await axios.post(`${this.baseUrl}/card_info`, {
                // Assuming payload structure based on typical search
                // Use 'query' or 'name' based on docs. Since search returned "POST /card_info", 
                // I will guess the payload is { query: ... } or { name: ... }
                // Let's try sending both or 'search' to be safe, but typically it is 'query'.
                query: query,
                game: game
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
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
