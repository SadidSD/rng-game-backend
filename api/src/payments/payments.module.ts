import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [ConfigModule, forwardRef(() => OrdersModule)],
    controllers: [PaymentsController],
    providers: [StripeService],
    exports: [StripeService],
})
export class PaymentsModule { }
