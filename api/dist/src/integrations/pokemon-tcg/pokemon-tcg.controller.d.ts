import { PokemonTcgService } from './pokemon-tcg.service';
export declare class PokemonTcgController {
    private readonly pokemonTcgService;
    constructor(pokemonTcgService: PokemonTcgService);
    search(query: string): Promise<{
        data: any;
    }>;
}
