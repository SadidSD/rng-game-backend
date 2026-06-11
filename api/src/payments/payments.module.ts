import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketsService } from '../events/tickets.service';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        forwardRef(() => OrdersModule),
    ],
    controllers: [PaymentsController],
    providers: [StripeService, TicketsService],
    exports: [StripeService],
})
export class PaymentsModule { }
