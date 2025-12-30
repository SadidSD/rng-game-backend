import { Module } from '@nestjs/common';
import { BuylistService } from './buylist.service';
import { BuylistController } from './buylist.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Module({
    imports: [PrismaModule],
    controllers: [BuylistController],
    providers: [BuylistService, ApiKeyGuard],
})
export class BuylistModule { }
