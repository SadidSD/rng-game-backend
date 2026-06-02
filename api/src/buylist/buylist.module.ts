import { Module } from '@nestjs/common';
import { BuylistService } from './buylist.service';
import { BuylistController } from './buylist.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { PokemonTcgModule } from '../integrations/pokemon-tcg/pokemon-tcg.module';
import { ScryfallService } from '../integrations/scryfall.service';

@Module({
    imports: [PrismaModule, PokemonTcgModule],
    controllers: [BuylistController],
    providers: [BuylistService, ApiKeyGuard, ScryfallService],
})
export class BuylistModule { }
