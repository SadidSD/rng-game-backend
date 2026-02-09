import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
    imports: [LoggerModule],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule { }
