import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ManapoolService {
    private readonly baseUrl = 'https://api.manapool.com';

    constructor(private configService: ConfigService) { }

    async searchCards(query: string, game: string = 'Pokemon') {
        const accessToken = this.configService.get<string>('MANAPOOL_ACCESS_TOKEN');

        if (!accessToken) {
            throw new HttpException('Manapool Access Token not configured', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            // Note: I am guessing the endpoint structure based on standard REST APIs.
            // Will likely need adjustment once documentation is fully clear.
            // Documentation search suggested public API, lets try /cards/search or similar.
            // For now, mapping query to a 'q' param.
            const response = await axios.get(`${this.baseUrl}/cards`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    q: query,
                    game: game
                }
            });
            return response.data;
        } catch (error) {
            console.error('Manapool API Error:', error.response?.data || error.message);
            // Fallback / Error handling
            throw new HttpException('Failed to fetch from Manapool', HttpStatus.BAD_GATEWAY);
        }
    }
}
