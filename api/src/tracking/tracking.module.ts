import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
    imports: [PrismaModule, NotificationModule, LoggerModule],
    providers: [TrackingService],
    exports: [TrackingService],
})
export class TrackingModule {}
