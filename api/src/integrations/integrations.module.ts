import { Module } from '@nestjs/common';
import { EbayService } from './ebay.service';
import { TcgPlayerService } from './tcgplayer.service';
import { WebhooksController } from './webhooks.controller';
import { IntegrationsController } from './integrations.controller';
import { ManapoolModule } from './manapool/manapool.module';

@Module({
    imports: [ManapoolModule],
    controllers: [WebhooksController, IntegrationsController],
    providers: [EbayService, TcgPlayerService],
})
export class IntegrationsModule { }
