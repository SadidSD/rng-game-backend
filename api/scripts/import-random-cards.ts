
import { PrismaClient, Condition } from '@prisma/client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Use the store ID from the environment
const STORE_ID = process.env.SINGLE_TENANT_STORE_ID || "cd7bfaac-8632-418e-a329-0f71653f07b0";

function kebabCase(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function getOrCreateCategory(name: string, parentId?: string) {
    const slug = kebabCase(name);
    return await prisma.category.upsert({
        where: { 
            storeId_slug: { 
                storeId: STORE_ID, 
                slug 
            } 
        },
        update: {},
        create: {
            name,
            slug,
            storeId: STORE_ID,
        }
    });
}

async function importCards() {
    try {
        console.log("🚀 Starting MTG Card Import...");

        // 1. Ensure Categories exist
        const mainCategory = await getOrCreateCategory("Magic: The Gathering");
        console.log(`✅ Main Category: ${mainCategory.name} (${mainCategory.id})`);

        // 2. Fetch 200 random cards from Scryfall
        // Scryfall returns 175 cards per page. We'll fetch 2 pages to get at least 200.
        let allCards: any[] = [];
        
        console.log("📡 Fetching random cards from Scryfall...");
        for (let page = 1; page <= 2; page++) {
            const res = await axios.get(`https://api.scryfall.com/cards/search`, {
                params: {
                    q: "game:paper is:firstprinting",
                    order: "random",
                    page: page
                }
            });
            allCards = allCards.concat(res.data.data);
            if (allCards.length >= 200) break;
            
            // Respect Scryfall's rate limit
            await new Promise(r => setTimeout(r, 100));
        }

        const cardsToImport = allCards.slice(0, 200);
        console.log(`📦 Found ${cardsToImport.length} cards to process.`);

        let successCount = 0;

        for (const cardData of cardsToImport) {
            try {
                // Determine subcategory based on type_line
                let subCatName = "Other";
                const type = cardData.type_line || "";
                if (type.includes("Creature")) subCatName = "Creatures";
                else if (type.includes("Instant") || type.includes("Sorce")) subCatName = "Spells";
                else if (type.includes("Artifact")) subCatName = "Artifacts";
                else if (type.includes("Enchantment")) subCatName = "Enchantments";
                else if (type.includes("Land")) subCatName = "Lands";
                else if (type.includes("Planeswalker")) subCatName = "Planeswalkers";

                // For simplicity, we'll put them all under MTG main category for now, 
                // but we could nest them if the schema supported parentId (it doesn't seem to have one in the schema).
                // Wait, let's check schema again for ParentId on Category.
                // Schema shows Category only has id, name, slug, description, image, storeId, products, createdAt, updatedAt.
                // No parentId. So we'll just use "Magic: The Gathering - [Sub]" as names if we want grouping.
                
                const category = await getOrCreateCategory(`MTG: ${subCatName}`);

                // 3. Upsert Card (Oracle Data)
                const oracleText = cardData.oracle_text || cardData.card_faces?.map((f: any) => f.oracle_text).join('\n//\n') || '';
                const manaCost = cardData.mana_cost || cardData.card_faces?.map((f: any) => f.mana_cost).join(' // ') || '';
                
                const card = await prisma.card.upsert({
                    where: { oracleId: cardData.oracle_id },
                    update: {
                        name: cardData.name,
                        oracleText,
                        manaCost,
                        manaValue: cardData.cmc,
                        colors: cardData.colors || [],
                        colorIdentity: cardData.color_identity || [],
                        typeLine: cardData.type_line,
                        legalities: cardData.legalities,
                        power: cardData.power,
                        toughness: cardData.toughness,
                        loyalty: cardData.loyalty
                    },
                    create: {
                        oracleId: cardData.oracle_id,
                        name: cardData.name,
                        oracleText,
                        manaCost,
                        manaValue: cardData.cmc,
                        colors: cardData.colors || [],
                        colorIdentity: cardData.color_identity || [],
                        typeLine: cardData.type_line,
                        legalities: cardData.legalities,
                        power: cardData.power,
                        toughness: cardData.toughness,
                        loyalty: cardData.loyalty
                    }
                });

                // 4. Create Product
                const slug = `${kebabCase(cardData.name)}-${cardData.set}-${cardData.collector_number}`;
                const product = await prisma.product.upsert({
                    where: { 
                        storeId_slug: { 
                            storeId: STORE_ID, 
                            slug 
                        } 
                    },
                    update: {
                        price: cardData.prices?.usd ? parseFloat(cardData.prices.usd) : 0.99,
                        images: cardData.image_uris ? [cardData.image_uris.normal] : 
                                cardData.card_faces?.[0]?.image_uris ? [cardData.card_faces[0].image_uris.normal] : []
                    },
                    create: {
                        name: cardData.name,
                        slug,
                        storeId: STORE_ID,
                        categoryId: category.id,
                        cardId: card.id,
                        set: cardData.set_name,
                        rarity: cardData.rarity,
                        collectorNumber: cardData.collector_number,
                        price: cardData.prices?.usd ? parseFloat(cardData.prices.usd) : 0.99,
                        images: cardData.image_uris ? [cardData.image_uris.normal] : 
                                cardData.card_faces ? cardData.card_faces.map((f: any) => f.image_uris?.normal).filter(Boolean) : [],
                        game: "MTG"
                    }
                });

                // 5. Create Variant (Standard NM)
                const gameCode = "MTG";
                const setCode = (cardData.set_name || 'UNK').toUpperCase().replace(/[^A-Z0-9]/g, '');
                const collector = (cardData.collector_number || '000').padStart(3, '0').replace(/[^A-Z0-9]/g, '');
                const nameSlug = cardData.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 25);
                const generatedSku = `${gameCode}-${setCode}-${collector}-${nameSlug}-NM-EN-NF`;

                const variant = await prisma.productVariant.upsert({
                    where: { sku: generatedSku },
                    update: {
                        price: product.price || 0.99
                    },
                    create: {
                        productId: product.id,
                        sku: generatedSku,
                        condition: "NM",
                        isFoil: false,
                        language: "English",
                        price: product.price || 0.99,
                        storeId: STORE_ID
                    }
                });

                // 6. Set Inventory
                await prisma.inventoryItem.upsert({
                    where: { variantId: variant.id },
                    update: { quantity: 10 },
                    create: {
                        variantId: variant.id,
                        quantity: 10,
                        storeId: STORE_ID
                    }
                });

                successCount++;
                if (successCount % 10 === 0) {
                    process.stdout.write(`.`);
                }

            } catch (err) {
                console.error(`\n❌ Error processing card: ${cardData.name}`, err.message);
            }
        }

        console.log(`\n\n✨ Import Complete! Successfully added/updated ${successCount} cards.`);

    } catch (error) {
        console.error("💀 Critical Error during import:", error);
    } finally {
        await prisma.$disconnect();
    }
}

importCards();
