import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PokemonTcgService } from './pokemon-tcg.service';

@Controller('integrations/pokemon-tcg')
export class PokemonTcgController {
    constructor(private readonly pokemonTcgService: PokemonTcgService) { }

    @Get('search')
    async search(@Query('query') query: string) {
        if (!query) {
            throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
        }
        return this.pokemonTcgService.searchCards(query);
    }
}
