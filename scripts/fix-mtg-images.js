
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('Fixing Missing MTG Images...');

    // 1. Find explicit MTG products or those that look like MTG
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { game: 'MTG' },
                { game: 'Magic: The Gathering' }
            ]
        }
    });

    console.log(`Found ${products.length} MTG products.`);

    let fixedCount = 0;

    for (const p of products) {
        // Check if image is missing (empty array or empty string)
        if (!p.images || p.images.length === 0 || p.images[0] === '') {
            console.log(`[${p.name}] Missing image. Fetching from Scryfall...`);

            try {
                // Construct Scryfall Query
                // Try exact match by set first, then fuzzy
                let scryfallUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(p.name)}`;
                if (p.set) {
                    scryfallUrl += `&set=${encodeURIComponent(p.set)}`;
                }

                const res = await axios.get(scryfallUrl);
                const card = res.data;

                let imageUrl = card.image_uris?.normal || card.image_uris?.large;

                // Handle Double Faced Cards
                if (!imageUrl && card.card_faces && card.card_faces[0].image_uris) {
                    imageUrl = card.card_faces[0].image_uris.normal;
                }

                if (imageUrl) {
                    // Update Product
                    await prisma.product.update({
                        where: { id: p.id },
                        data: {
                            images: [imageUrl]
                        }
                    });
                    console.log(` -> Fixed: ${imageUrl}`);
                    fixedCount++;
                } else {
                    console.warn(` -> No image found for ${p.name}`);
                }

                // Rate limit (Scryfall asks for 100ms)
                await delay(150);

            } catch (error) {
                console.error(` -> Failed to fetch ${p.name}: ${error.response?.status || error.message}`);
                // Try fuzzy search fallback?
                if (error.response?.status === 404) {
                    console.log('   -> Retrying with fuzzy search...');
                    try {
                        const fuzzyRes = await axios.get(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(p.name)}`);
                        const fuzzyCard = fuzzyRes.data;
                        let fuzzyImage = fuzzyCard.image_uris?.normal || fuzzyCard.image_uris?.large;
                        if (fuzzyImage) {
                            await prisma.product.update({
                                where: { id: p.id },
                                data: { images: [fuzzyImage] }
                            });
                            console.log(`   -> Fixed (Fuzzy): ${fuzzyImage}`);
                            fixedCount++;
                        }
                    } catch (fuzzyErr) {
                        console.error('   -> Fuzzy failed too.');
                    }
                }
                await delay(150);
            }
        } else {
            // console.log(`[${p.name}] Image OK.`);
        }
    }

    console.log(`Done. Fixed ${fixedCount} products.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
