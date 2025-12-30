import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicProductsController {
    constructor(private prisma: PrismaService) { }

    @Get('products')
    async getProducts(@Request() req) {
        const storeId = req.store.id;

        // Fetch products strictly for this store
        const products = await this.prisma.product.findMany({
            where: { storeId },
            include: { variants: true }, // Include variants (prices/conditions)
        });

        return {
            store: req.store.name,
            count: products.length,
            data: products
        };
    }
}
