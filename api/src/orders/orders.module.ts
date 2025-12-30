import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Module({
    imports: [PrismaModule],
    controllers: [OrdersController],
    providers: [OrdersService, ApiKeyGuard],
})
export class OrdersModule { }
