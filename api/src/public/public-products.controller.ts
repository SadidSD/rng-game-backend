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
        const query = req.query;
        const where: any = { storeId };

        // --- Layer 1: Card Identity (Oracle) ---
        const cardWhere: any = {};
        let hasCardFilters = false;

        if (query.name) {
            // Flexible name search
            where.name = { contains: query.name as string, mode: 'insensitive' };
        }

        if (query.colors) {
            // "W,U" -> hasSome: ['W', 'U']
            // Use colorIdentity for Commander-friendly filtering
            const colors = (query.colors as string).split(',');
            cardWhere.colorIdentity = { hasSome: colors };
            hasCardFilters = true;
        }

        if (query.type) {
            // "Creature" -> contains "Creature"
            cardWhere.typeLine = { contains: query.type as string, mode: 'insensitive' };
            hasCardFilters = true;
        }

        if (query.cmcMin || query.cmcMax) {
            cardWhere.manaValue = {};
            if (query.cmcMin) cardWhere.manaValue.gte = parseFloat(query.cmcMin as string);
            if (query.cmcMax) cardWhere.manaValue.lte = parseFloat(query.cmcMax as string);
            hasCardFilters = true;
        }

        if (query.format) {
            // JSON query for legality: legalities->>'commander' = 'legal'
            // Prisma JSON filtering is tricky, often requires raw query or specific syntax
            // For now, let's skip complex JSON filtering or use 'path' if supported, 
            // or fetch all and filter in memory if volume is low (not ideal for scalable).
            // Better approach: Add specific boolean columns for popular formats if performance matters.
            // For this MVP, we will rely on frontend to filter or skip if too complex for strict Prisma.
            // *Wait*, we can use `path` filter for JSONb in Postgres/Prisma.
            const format = (query.format as string).toLowerCase();
            cardWhere.legalities = {
                path: [format],
                equals: 'legal'
            };
            hasCardFilters = true;
        }

        if (hasCardFilters) {
            where.card = cardWhere;
        }

        // --- Layer 2: Printing / Set ---
        if (query.set) {
            where.set = { contains: query.set as string, mode: 'insensitive' };
        }

        if (query.rarity) {
            where.rarity = { equals: query.rarity as string, mode: 'insensitive' };
        }

        // --- Layer 3: Buyable Variants ---
        const variantWhere: any = {};
        let hasVariantFilters = false;

        if (query.priceMin || query.priceMax) {
            variantWhere.price = {};
            if (query.priceMin) variantWhere.price.gte = parseFloat(query.priceMin as string);
            if (query.priceMax) variantWhere.price.lte = parseFloat(query.priceMax as string);
            hasVariantFilters = true;
        }

        if (query.foil) {
            variantWhere.isFoil = query.foil === 'true';
            hasVariantFilters = true;
        }

        if (query.inStock === 'true') {
            variantWhere.inventory = {
                quantity: { gt: 0 }
            };
            hasVariantFilters = true;
        }

        if (hasVariantFilters) {
            where.variants = {
                some: variantWhere
            };
        }

        // Sorting strategy
        let orderBy: any = { createdAt: 'desc' };
        if (query.sort === 'price_asc') orderBy = { price: 'asc' };
        if (query.sort === 'price_desc') orderBy = { price: 'desc' };
        if (query.sort === 'name_asc') orderBy = { name: 'asc' };

        // Fetch products strictly for this store
        const products = await this.prisma.product.findMany({
            where,
            include: {
                variants: {
                    include: { inventory: true }
                },
                card: true, // Critical for Layer 1 display
                category: true
            },
            orderBy,
            take: 100
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
