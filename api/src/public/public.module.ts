import { Module } from '@nestjs/common';
import { PublicProductsController } from './public-products.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@Module({
    imports: [PrismaModule],
    controllers: [PublicProductsController],
    providers: [ApiKeyGuard],
})
export class PublicModule { }
