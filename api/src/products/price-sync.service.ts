import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class PriceSyncService implements OnModuleInit {
    private readonly logger = new Logger(PriceSyncService.name);
    private isSyncing = false;

    constructor(private prisma: PrismaService) {}

    onModuleInit() {
        // Run the first sync 30 seconds after startup (let the app stabilize first)
        setTimeout(() => this.syncPrices(), 30_000);
    }

    /**
     * Runs every 10 minutes (600,000ms).
     * Uses Scryfall's /cards/collection endpoint to batch-fetch prices.
     * Each request handles up to 75 cards, keeping us well within rate limits.
     */
    @Interval(600_000)
    async syncPrices() {
        // Prevent overlapping runs
        if (this.isSyncing) {
            this.logger.warn('Price sync already in progress, skipping...');
            return;
        }

        this.isSyncing = true;
        const startTime = Date.now();

        try {
            // 1. Get all MTG products with their oracle IDs and variant IDs
            const products = await this.prisma.product.findMany({
                where: {
                    game: 'MTG',
                    card: { isNot: null },
                },
                select: {
                    id: true,
                    name: true,
                    set: true,
                    collectorNumber: true,
                    card: {
                        select: { oracleId: true },
                    },
                    variants: {
                        select: { id: true, isFoil: true },
                    },
                },
            });

            if (products.length === 0) {
                this.logger.log('No MTG products found to sync prices for.');
                return;
            }

            this.logger.log(`🔄 Starting price sync for ${products.length} products...`);

            // 2. Build Scryfall identifiers using oracle_id (most reliable match)
            const productsByOracle = new Map<string, typeof products[number][]>();
            for (const p of products) {
                if (!p.card?.oracleId) continue;
                const existing = productsByOracle.get(p.card.oracleId) || [];
                existing.push(p);
                productsByOracle.set(p.card.oracleId, existing);
            }

            const identifiers = Array.from(productsByOracle.keys()).map(oracleId => ({
                oracle_id: oracleId,
            }));

            // 3. Batch into groups of 75 (Scryfall limit)
            const batches = this.chunk(identifiers, 75);
            const priceMap = new Map<string, { usd: number | null; usd_foil: number | null }>();

            for (let i = 0; i < batches.length; i++) {
                try {
                    const response = await axios.post(
                        'https://api.scryfall.com/cards/collection',
                        { identifiers: batches[i] },
                        {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 30_000,
                        },
                    );

                    for (const card of response.data.data || []) {
                        priceMap.set(card.oracle_id, {
                            usd: card.prices?.usd ? parseFloat(card.prices.usd) : null,
                            usd_foil: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null,
                        });
                    }

                    // Respect Scryfall rate limit: 100ms between requests
                    if (i < batches.length - 1) {
                        await this.delay(100);
                    }
                } catch (err) {
                    this.logger.error(`Failed to fetch batch ${i + 1}/${batches.length}: ${err.message}`);
                }
            }

            // 4. Update prices in the database
            let updated = 0;
            const txOps: any[] = [];

            for (const product of products) {
                const oracleId = product.card?.oracleId;
                if (!oracleId) continue;

                const prices = priceMap.get(oracleId);

                if (!prices) continue;

                // Determine base price (non-foil preferred, fallback to foil)
                const basePrice = prices.usd ?? prices.usd_foil;
                if (basePrice === null) continue;

                // Update the product's display price
                txOps.push(
                    this.prisma.product.update({
                        where: { id: product.id },
                        data: { price: basePrice },
                    }),
                );

                // Update each variant's price based on foil status
                for (const variant of product.variants) {
                    const variantPrice = variant.isFoil
                        ? (prices.usd_foil ?? prices.usd ?? basePrice)
                        : (prices.usd ?? basePrice);

                    txOps.push(
                        this.prisma.productVariant.update({
                            where: { id: variant.id },
                            data: { price: variantPrice },
                        }),
                    );
                }

                updated++;
            }

            // Execute all updates in a single transaction
            if (txOps.length > 0) {
                await this.prisma.$transaction(txOps);
            }

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            this.logger.log(`✅ Price sync complete: updated ${updated}/${products.length} products in ${elapsed}s`);

        } catch (error) {
            this.logger.error(`❌ Price sync failed: ${error.message}`);
        } finally {
            this.isSyncing = false;
        }
    }

    private chunk<T>(arr: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
