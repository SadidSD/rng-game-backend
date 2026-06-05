import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PriceSyncService } from './price-sync.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { PokemonTcgModule } from '../integrations/pokemon-tcg/pokemon-tcg.module';

@Module({
    imports: [PrismaModule, IntegrationsModule, PokemonTcgModule],
    controllers: [ProductsController],
    providers: [ProductsService, PriceSyncService],
})
export class ProductsModule { }
