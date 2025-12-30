import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Module({
    imports: [PrismaModule],
    controllers: [EventsController],
    providers: [EventsService, ApiKeyGuard],
})
export class EventsModule { }
