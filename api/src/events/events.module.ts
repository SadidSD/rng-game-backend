import { Module, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TicketsService } from './tickets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { ConfigModule } from '@nestjs/config';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [PrismaModule, ConfigModule, forwardRef(() => PaymentsModule)],
    controllers: [EventsController],
    providers: [EventsService, TicketsService, ApiKeyGuard],
    exports: [TicketsService],
})
export class EventsModule { }
