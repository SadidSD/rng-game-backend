import { Module } from '@nestjs/common';
import { TcgPlayerService } from './tcgplayer.service';
import { WebhooksController } from './webhooks.controller';
import { IntegrationsController } from './integrations.controller';
import { EasypostModule } from './easypost/easypost.module';
import { ScryfallService } from './scryfall.service';

@Module({
    imports: [EasypostModule],
    controllers: [WebhooksController, IntegrationsController],
    providers: [TcgPlayerService, ScryfallService],
    exports: [EasypostModule, ScryfallService]
})
export class IntegrationsModule { }
