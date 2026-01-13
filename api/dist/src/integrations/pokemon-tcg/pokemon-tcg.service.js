"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokemonTcgService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const https = __importStar(require("https"));
let PokemonTcgService = class PokemonTcgService {
    configService;
    baseUrl = 'https://api.pokemontcg.io/v2';
    httpsAgent = new https.Agent({ family: 4 });
    constructor(configService) {
        this.configService = configService;
    }
    async searchCards(query) {
        const apiKey = this.configService.get('POKEMON_TCG_API_KEY');
        try {
            const hasSpaces = query.includes(' ');
            const sanitizedQuery = query.replace(/[":]/g, '');
            const luceneQuery = hasSpaces
                ? `name:"${sanitizedQuery}"`
                : `name:${sanitizedQuery}*`;
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            if (apiKey) {
                headers['X-Api-Key'] = apiKey;
            }
            const url = `${this.baseUrl}/cards?q=${encodeURIComponent(luceneQuery)}&pageSize=15&select=id,name,images,set,rarity,tcgplayer,cardmarket`;
            console.log(`PokemonTCG Request: ${url}`);
            const response = await axios_1.default.get(url, {
                headers,
                timeout: 30000,
                httpsAgent: this.httpsAgent
            });
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
                    price: card.cardmarket?.prices?.averageSellPrice
                }))
            };
        }
        catch (error) {
            console.error(`PokemonTCG API Error [${error.config?.url}]:`, error.response?.data || error.message);
            throw new common_1.HttpException({
                message: 'Failed to fetch from PokemonTCG API',
                details: error.response?.data || error.message
            }, error.response?.status || common_1.HttpStatus.BAD_GATEWAY);
        }
    }
};
exports.PokemonTcgService = PokemonTcgService;
exports.PokemonTcgService = PokemonTcgService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PokemonTcgService);
//# sourceMappingURL=pokemon-tcg.service.js.map