import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { IntegrationsModule } from '../integrations/integrations.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [PrismaModule, PaymentsModule, IntegrationsModule, NotificationModule],
    controllers: [OrdersController],
    providers: [OrdersService, ApiKeyGuard],
    exports: [OrdersService],
})
export class OrdersModule { }
