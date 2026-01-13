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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PokemonTcgController = void 0;
const common_1 = require("@nestjs/common");
const pokemon_tcg_service_1 = require("./pokemon-tcg.service");
let PokemonTcgController = class PokemonTcgController {
    pokemonTcgService;
    constructor(pokemonTcgService) {
        this.pokemonTcgService = pokemonTcgService;
    }
    async search(query) {
        if (!query) {
            throw new common_1.HttpException('Query parameter is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.pokemonTcgService.searchCards(query);
    }
};
exports.PokemonTcgController = PokemonTcgController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PokemonTcgController.prototype, "search", null);
exports.PokemonTcgController = PokemonTcgController = __decorate([
    (0, common_1.Controller)('integrations/pokemon-tcg'),
    __metadata("design:paramtypes", [pokemon_tcg_service_1.PokemonTcgService])
], PokemonTcgController);
//# sourceMappingURL=pokemon-tcg.controller.js.map