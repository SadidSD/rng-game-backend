import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PokemonTcgService } from './pokemon-tcg.service';
import { PokemonTcgController } from './pokemon-tcg.controller';

@Module({
    imports: [ConfigModule],
    controllers: [PokemonTcgController],
    providers: [PokemonTcgService],
    exports: [PokemonTcgService]
})
export class PokemonTcgModule { }
