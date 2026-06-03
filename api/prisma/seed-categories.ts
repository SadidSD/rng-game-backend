import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Categories Seed...');

    const storeId = process.env.SINGLE_TENANT_STORE_ID;
    if (!storeId) {
        console.error('❌ SINGLE_TENANT_STORE_ID environment variable is required');
        process.exit(1);
    }

    // Ensure the default store exists
    const store = await prisma.store.findUnique({
        where: { id: storeId }
    });

    if (!store) {
        console.error(`❌ Store with ID ${storeId} not found. Please run seed.ts first.`);
        process.exit(1);
    }

    console.log(`✅ Found Store: ${store.name}`);

    const categoriesToSeed = [
        { name: 'Magic: The Gathering', slug: 'magic-the-gathering', description: 'Magic: The Gathering trading cards and singles' },
        { name: 'Pokemon', slug: 'pokemon', description: 'Pokémon trading cards and singles' },
        { name: 'Yu-Gi-Oh!', slug: 'yu-gi-oh', description: 'Yu-Gi-Oh! trading cards and singles' },
        { name: 'Sports Cards', slug: 'sports-cards', description: 'Sports cards (Baseball, Basketball, Football, etc.)' },
        { name: 'Supplies', slug: 'supplies', description: 'Card sleeves, deck boxes, binders, and other accessories' },
        { name: 'Graded Cards', slug: 'graded-cards', description: 'PSA, BGS, and CGC graded collectible cards' },
        { name: 'Booster Boxes', slug: 'booster-boxes', description: 'Sealed TCG Booster Boxes' },
        { name: 'Booster Packs', slug: 'booster-packs', description: 'Sealed TCG Booster Packs' },
        { name: 'Bundles', slug: 'bundles', description: 'Sealed TCG Bundles, Elite Trainer Boxes, and Gift Packages' },
        { name: 'Precon Decks', slug: 'precon-decks', description: 'Preconstructed commander decks, starter decks, and battle decks' },
        { name: "Collector's Editions", slug: 'collectors-editions', description: 'Collector booster boxes and special editions' },
        { name: 'Starter Kits', slug: 'starter-kits', description: 'Sealed Starter Kits and two-player starter sets' },
        { name: 'Lorcana', slug: 'lorcana', description: 'Disney Lorcana trading cards and singles' },
        { name: 'One Piece', slug: 'one-piece', description: 'One Piece Card Game trading cards and singles' }
    ];

    for (const cat of categoriesToSeed) {
        const category = await prisma.category.upsert({
            where: {
                storeId_slug: {
                    storeId,
                    slug: cat.slug
                }
            },
            update: {
                name: cat.name,
                description: cat.description
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                storeId
            }
        });
        console.log(`✅ Category ensured: ${category.name} (${category.slug})`);
    }

    console.log('🎉 Categories Seeded Successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding categories:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
