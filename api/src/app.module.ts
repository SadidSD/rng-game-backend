import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
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
import { PaymentsModule } from './payments/payments.module';
import { SentryModule } from './sentry/sentry.module';
import { LoggerModule } from './logger/logger.module';
import { SanitizationMiddleware } from './middleware/sanitization.middleware';
import { HttpsRedirectMiddleware } from './middleware/https-redirect.middleware';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notifications/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute (global default)
    }]),
    ScheduleModule.forRoot(),
    SentryModule,
    LoggerModule,
    NotificationModule,
    HealthModule,
    AuthModule, UsersModule, StoreModule, PublicModule, ProductsModule, InventoryModule, BuylistModule, OrdersModule, CustomersModule, EventsModule, AnalyticsModule, IntegrationsModule, UploadsModule, CategoriesModule, PrismaModule, PokemonTcgModule, PaymentsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply globally
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpsRedirectMiddleware, SanitizationMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
