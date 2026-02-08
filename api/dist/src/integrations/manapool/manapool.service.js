"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManapoolService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let ManapoolService = class ManapoolService {
    configService;
    baseUrl;
    constructor(configService) {
        this.configService = configService;
        this.baseUrl = 'https://manapool.com/api/v1';
    }
    priceCache = null;
    CACHE_TTL = 60 * 60 * 1000;
    async searchCards(query, game = 'Pokemon') {
        const prices = await this.getAllPrices();
        const lowerQuery = query.toLowerCase();
        return {
            data: prices.filter(card => card.name.toLowerCase().includes(lowerQuery) ||
                (card.scryfall_id && card.scryfall_id === query)).map(card => ({
                ...card,
                price: card.price_cents / 100,
                price_foil: card.price_cents_foil ? card.price_cents_foil / 100 : null,
                price_etched: card.price_cents_etch ? card.price_cents_etch / 100 : null,
                marketPrice: card.price_cents / 100,
                currency: 'USD',
                raw_data: card
            }))
        };
    }
    async getAllPrices() {
        if (this.priceCache && (Date.now() - this.priceCache.timestamp < this.CACHE_TTL)) {
            return this.priceCache.data;
        }
        const accessToken = this.configService.get('MANAPOOL_ACCESS_TOKEN');
        console.log(`[Manapool] Token available: ${accessToken ? 'YES' : 'NO'} (${accessToken ? accessToken.substring(0, 5) + '...' : ''})`);
        if (!accessToken)
            throw new common_1.HttpException('Manapool Token Missing in Environment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        try {
            console.log(`[Manapool] Fetching prices from ${this.baseUrl}/prices/singles...`);
            const response = await axios_1.default.get(`${this.baseUrl}/prices/singles`, {
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
        }
        catch (error) {
            console.error('Manapool Price Fetch Error FULL:', error);
            const cause = error.response?.data?.message || error.message;
            throw new common_1.HttpException(`Failed to fetch Manapool prices: ${cause}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ManapoolService = ManapoolService;
exports.ManapoolService = ManapoolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ManapoolService);
//# sourceMappingURL=manapool.service.js.map