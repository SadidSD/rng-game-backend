import { Module } from '@nestjs/common';
import { BuylistService } from './buylist.service';
import { BuylistController } from './buylist.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { PokemonTcgModule } from '../integrations/pokemon-tcg/pokemon-tcg.module';

@Module({
    imports: [PrismaModule, PokemonTcgModule],
    controllers: [BuylistController],
    providers: [BuylistService, ApiKeyGuard],
})
export class BuylistModule { }
