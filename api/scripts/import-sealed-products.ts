import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const STORE_ID = "d02dbcba-81b5-4f9d-831c-54fe9a803081";

function kebabCase(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getOrCreateCategory(name: string) {
    const slug = kebabCase(name);
    return await prisma.category.upsert({
        where: { storeId_slug: { storeId: STORE_ID, slug } },
        update: {},
        create: { name, slug, storeId: STORE_ID }
    });
}

// Sealed product templates per set
const SEALED_TYPES = [
    { suffix: 'Draft Booster Box', category: 'Booster Boxes', priceRange: [90, 130] },
    { suffix: 'Collector Booster Box', category: "Collector's Editions", priceRange: [200, 350] },
    { suffix: 'Bundle', category: 'Bundles', priceRange: [35, 50] },
    { suffix: 'Draft Booster Pack', category: 'Booster Packs', priceRange: [3.5, 5] },
    { suffix: 'Collector Booster Pack', category: 'Booster Packs', priceRange: [18, 30] },
];

const PRECON_TEMPLATES = [
    { suffix: 'Commander Deck', category: 'Precon Decks', priceRange: [35, 55] },
    { suffix: 'Starter Kit', category: 'Starter Kits', priceRange: [12, 20] },
];

// Assets mapping for premium placeholders
const ASSET_MAP: Record<string, string> = {
    'Booster Box': '/images/assets/booster-box-premium.png',
    'Booster Pack': '/images/assets/booster-pack-premium.png',
    'Bundle': '/images/assets/bundle-box-premium.png',
    'Commander Deck': '/images/assets/precon-deck-premium.png',
};

function getProductImage(productName: string, fallback: string) {
    for (const [key, asset] of Object.entries(ASSET_MAP)) {
        if (productName.includes(key)) return asset;
    }
    return fallback;
}

async function importSealedProducts() {
    try {
        console.log("📦 Starting Sealed Products Import...\n");

        // 1. Create sealed categories
        const categories: Record<string, any> = {};
        const categoryNames = [
            'Booster Packs', 'Booster Boxes', 'Bundles',
            'Precon Decks', "Collector's Editions", 'Starter Kits'
        ];
        for (const name of categoryNames) {
            categories[name] = await getOrCreateCategory(name);
            console.log(`✅ Category: ${name} (${categories[name].id})`);
        }

        // 2. Fetch recent popular sets from Scryfall
        console.log("\n📡 Fetching sets from Scryfall...");
        const setsResponse = await axios.get('https://api.scryfall.com/sets');
        const allSets = setsResponse.data.data;

        // Pick recent expansion/core sets for sealed products
        const targetSets = allSets
            .filter((s: any) =>
                ['expansion', 'core', 'masters', 'draft_innovation'].includes(s.set_type) &&
                !s.digital &&
                new Date(s.released_at) > new Date('2020-01-01')
            )
            .slice(0, 8); // Top 8 most recent

        console.log(`📋 Selected ${targetSets.length} sets for sealed products\n`);

        let successCount = 0;

        for (const set of targetSets) {
            // Get set icon for imagery
            const setIcon = set.icon_svg_uri || '';

            // Fetch a sample card image from this set to use as product image
            let setImage = '';
            try {
                await new Promise(r => setTimeout(r, 100)); // Rate limit
                const searchRes = await axios.get(`https://api.scryfall.com/cards/search`, {
                    params: { q: `set:${set.code} is:booster`, order: 'random', page: 1 }
                });
                const sampleCard = searchRes.data.data?.[0];
                if (sampleCard) {
                    setImage = sampleCard.image_uris?.normal || sampleCard.card_faces?.[0]?.image_uris?.normal || '';
                }
            } catch {
                // Some sets might not have booster cards, that's fine
            }

            // Create standard sealed products for this set
            for (const template of SEALED_TYPES) {
                const productName = `${set.name} ${template.suffix}`;
                const slug = `${kebabCase(productName)}-sealed`;
                const price = +(template.priceRange[0] + Math.random() * (template.priceRange[1] - template.priceRange[0])).toFixed(2);
                const category = categories[template.category];

                try {
                    const productImage = getProductImage(productName, setImage);
                    const product = await prisma.product.upsert({
                        where: { storeId_slug: { storeId: STORE_ID, slug } },
                        update: { price, images: productImage ? [productImage] : [] },
                        create: {
                            name: productName,
                            slug,
                            storeId: STORE_ID,
                            categoryId: category.id,
                            set: set.name,
                            price,
                            images: productImage ? [productImage] : [],
                            game: 'MTG',
                            tags: ['sealed', template.category.toLowerCase().replace(/[^a-z]+/g, '-')],
                        }
                    });

                    // Create a variant (Sealed/English)
                    const sku = `SKU-${product.id}-SEALED`;
                    const variant = await prisma.productVariant.upsert({
                        where: { sku },
                        update: { price },
                        create: {
                            productId: product.id,
                            sku,
                            condition: 'SEALED',
                            isFoil: false,
                            language: 'English',
                            price,
                            storeId: STORE_ID
                        }
                    });

                    // Set inventory
                    await prisma.inventoryItem.upsert({
                        where: { variantId: variant.id },
                        update: { quantity: Math.floor(Math.random() * 20) + 3 },
                        create: {
                            variantId: variant.id,
                            quantity: Math.floor(Math.random() * 20) + 3,
                            storeId: STORE_ID
                        }
                    });

                    successCount++;
                } catch (err: any) {
                    console.error(`  ❌ Error: ${productName} — ${err.message}`);
                }
            }

            // Create commander precon for this set if it's an expansion
            if (set.set_type === 'expansion') {
                const precon = PRECON_TEMPLATES[0];
                const productName = `${set.name} ${precon.suffix}`;
                const slug = `${kebabCase(productName)}-sealed`;
                const price = +(precon.priceRange[0] + Math.random() * (precon.priceRange[1] - precon.priceRange[0])).toFixed(2);
                const category = categories[precon.category];

                try {
                    const productImage = getProductImage(productName, setImage);
                    const product = await prisma.product.upsert({
                        where: { storeId_slug: { storeId: STORE_ID, slug } },
                        update: { price, images: productImage ? [productImage] : [] },
                        create: {
                            name: productName,
                            slug,
                            storeId: STORE_ID,
                            categoryId: category.id,
                            set: set.name,
                            price,
                            images: productImage ? [productImage] : [],
                            game: 'MTG',
                            tags: ['sealed', 'precon', 'commander'],
                        }
                    });

                    const sku = `SKU-${product.id}-SEALED`;
                    const variant = await prisma.productVariant.upsert({
                        where: { sku },
                        update: { price },
                        create: {
                            productId: product.id,
                            sku,
                            condition: 'SEALED',
                            isFoil: false,
                            language: 'English',
                            price,
                            storeId: STORE_ID
                        }
                    });

                    await prisma.inventoryItem.upsert({
                        where: { variantId: variant.id },
                        update: { quantity: Math.floor(Math.random() * 10) + 2 },
                        create: {
                            variantId: variant.id,
                            quantity: Math.floor(Math.random() * 10) + 2,
                            storeId: STORE_ID
                        }
                    });

                    successCount++;
                } catch (err: any) {
                    console.error(`  ❌ Error: ${productName} — ${err.message}`);
                }
            }

            console.log(`  📦 ${set.name} — products created`);
        }

        console.log(`\n✨ Import Complete! Successfully added/updated ${successCount} sealed products.`);

    } catch (error) {
        console.error("💀 Critical Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

importSealedProducts();
