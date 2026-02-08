import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
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
            include: {
                variants: true,
                category: true // Include category for frontend filtering
            },
        });

        return {
            store: req.store.name,
            count: products.length,
            data: products
        };
    }

    @Get('products/:id')
    async getProduct(@Request() req, @Param('id') id: string) {
        const storeId = req.store.id;
        const product = await this.prisma.product.findFirst({
            where: { id, storeId },
            include: {
                variants: {
                    include: { inventory: true }
                },
                card: true, // Critical for PDP Oracle Text
                category: true
            }
        });

        if (!product) return null; // Or throw NotFoundException
        return product;
    }
}
