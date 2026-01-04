import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ManapoolService {
    private readonly baseUrl = 'https://manapool.com/api/v1';

    constructor(private configService: ConfigService) { }

    async searchCards(query: string, game: string = 'Pokemon') {
        const accessToken = this.configService.get<string>('MANAPOOL_ACCESS_TOKEN');

        if (!accessToken) {
            throw new HttpException('Manapool Access Token not configured', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        try {
            // Using POST /card_info as per documentation findings
            const response = await axios.post(`${this.baseUrl}/card_info`,
                {
                    // Attempting to filter by name/query. Schema is not fully known so using 'name' and 'query'.
                    name: query,
                    game: game
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
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
