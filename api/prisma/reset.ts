/**
 * RESET SCRIPT — Clears all business data from the production database.
 * Keeps: Store, User, ApiKey records.
 * Deletes (in FK-safe order):
 *   EventPlayer → Event
 *   BuylistItem → BuylistOfferImage → BuylistOffer
 *   BuylistFeaturedCard, BuylistRule
 *   OrderItem → Order
 *   Customer
 *   InventoryItem → ProductVariant → Product
 *   Category
 *   Card
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚨 Starting full data reset...');
    console.log('ℹ️  Store, Users, and ApiKeys will be preserved.\n');

    // ── Events ──────────────────────────────────────────────────────────────
    const eventPlayers = await prisma.eventPlayer.deleteMany({});
    console.log(`✅ Deleted ${eventPlayers.count} event player registrations`);

    const events = await prisma.event.deleteMany({});
    console.log(`✅ Deleted ${events.count} events`);

    // ── Buylist ──────────────────────────────────────────────────────────────
    const buylistItems = await prisma.buylistItem.deleteMany({});
    console.log(`✅ Deleted ${buylistItems.count} buylist items`);

    const buylistImages = await prisma.buylistOfferImage.deleteMany({});
    console.log(`✅ Deleted ${buylistImages.count} buylist offer images`);

    const buylistOffers = await prisma.buylistOffer.deleteMany({});
    console.log(`✅ Deleted ${buylistOffers.count} buylist offers`);

    const buylistFeatured = await prisma.buylistFeaturedCard.deleteMany({});
    console.log(`✅ Deleted ${buylistFeatured.count} featured buylist cards`);

    const buylistRules = await prisma.buylistRule.deleteMany({});
    console.log(`✅ Deleted ${buylistRules.count} buylist pricing rules`);

    // ── Orders ───────────────────────────────────────────────────────────────
    const orderItems = await prisma.orderItem.deleteMany({});
    console.log(`✅ Deleted ${orderItems.count} order items`);

    const orders = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${orders.count} orders`);

    // ── Customers ────────────────────────────────────────────────────────────
    const customers = await prisma.customer.deleteMany({});
    console.log(`✅ Deleted ${customers.count} customers`);

    // ── Products & Inventory ─────────────────────────────────────────────────
    const inventoryItems = await prisma.inventoryItem.deleteMany({});
    console.log(`✅ Deleted ${inventoryItems.count} inventory items`);

    const variants = await prisma.productVariant.deleteMany({});
    console.log(`✅ Deleted ${variants.count} product variants`);

    const products = await prisma.product.deleteMany({});
    console.log(`✅ Deleted ${products.count} products`);

    const categories = await prisma.category.deleteMany({});
    console.log(`✅ Deleted ${categories.count} categories`);

    // ── Card Oracle Data ─────────────────────────────────────────────────────
    const cards = await prisma.card.deleteMany({});
    console.log(`✅ Deleted ${cards.count} card oracle records`);

    console.log('\n🎉 Reset complete! Database is fresh.');
    console.log('   Store, Users, and ApiKeys have been preserved.');
}

main()
    .catch((e) => {
        console.error('❌ Reset failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
