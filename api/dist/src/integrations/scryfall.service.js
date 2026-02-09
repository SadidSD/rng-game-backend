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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScryfallService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const https = __importStar(require("https"));
let ScryfallService = class ScryfallService {
    baseUrl = 'https://api.scryfall.com';
    httpsAgent = new https.Agent({ keepAlive: true });
    async searchCardByName(name) {
        const url = `${this.baseUrl}/cards/named?fuzzy=${encodeURIComponent(name)}`;
        try {
            console.log(`[Scryfall] Fetching: ${name}`);
            const response = await axios_1.default.get(url, {
                httpsAgent: this.httpsAgent,
                timeout: 10000
            });
            const card = response.data;
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
                manaCost: card.mana_cost,
                manaValue: card.cmc,
                colors: card.colors || [],
                colorIdentity: card.color_identity || [],
                typeLine: card.type_line,
                power: card.power,
                toughness: card.toughness,
                loyalty: card.loyalty,
                supertypes: [],
                subtypes: []
            };
        }
        catch (error) {
            console.error(`[Scryfall] Error fetching ${name}:`, error.message);
            return null;
        }
    }
};
exports.ScryfallService = ScryfallService;
exports.ScryfallService = ScryfallService = __decorate([
    (0, common_1.Injectable)()
], ScryfallService);
//# sourceMappingURL=scryfall.service.js.map