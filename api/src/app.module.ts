import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoreModule } from './store/store.module';
import { PublicModule } from './public/public.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { BuylistModule } from './buylist/buylist.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { EventsModule } from './events/events.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { UploadsModule } from './uploads/uploads.module';
import { CategoriesModule } from './categories/categories.module';
import { PrismaModule } from './prisma/prisma.module';
import { PokemonTcgModule } from './integrations/pokemon-tcg/pokemon-tcg.module';

@Module({
  imports: [AuthModule, UsersModule, StoreModule, PublicModule, ProductsModule, InventoryModule, BuylistModule, OrdersModule, CustomersModule, EventsModule, AnalyticsModule, IntegrationsModule, UploadsModule, CategoriesModule, PrismaModule, PokemonTcgModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
