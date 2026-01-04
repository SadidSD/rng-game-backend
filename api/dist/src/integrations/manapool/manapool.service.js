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
    baseUrl = 'https://api.manapool.com';
    constructor(configService) {
        this.configService = configService;
    }
    async searchCards(query, game = 'Pokemon') {
        const accessToken = this.configService.get('MANAPOOL_ACCESS_TOKEN');
        if (!accessToken) {
            throw new common_1.HttpException('Manapool Access Token not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/cards`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    q: query,
                    game: game
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Manapool API Error:', error.response?.data || error.message);
            throw new common_1.HttpException('Failed to fetch from Manapool', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
};
exports.ManapoolService = ManapoolService;
exports.ManapoolService = ManapoolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ManapoolService);
//# sourceMappingURL=manapool.service.js.map