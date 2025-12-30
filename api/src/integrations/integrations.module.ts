import { Module } from '@nestjs/common';
import { EbayService } from './ebay.service';
import { TcgPlayerService } from './tcgplayer.service';
import { WebhooksController } from './webhooks.controller';
import { IntegrationsController } from './integrations.controller';

@Module({
    controllers: [WebhooksController, IntegrationsController],
    providers: [EbayService, TcgPlayerService],
})
export class IntegrationsModule { }
