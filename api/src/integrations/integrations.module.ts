import { Module } from '@nestjs/common';
import { TcgPlayerService } from './tcgplayer.service';
import { WebhooksController } from './webhooks.controller';
import { IntegrationsController } from './integrations.controller';
import { EasypostModule } from './easypost/easypost.module';

@Module({
    imports: [EasypostModule],
    controllers: [WebhooksController, IntegrationsController],
    providers: [TcgPlayerService],
    exports: [EasypostModule]
})
export class IntegrationsModule { }
