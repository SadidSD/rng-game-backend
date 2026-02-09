
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function backfillCards() {
    try {
        console.log("Starting Bulk Card Backfill...");

        // 1. Get all products (or just those missing cardId? For safety, let's process all to ensure latest data)
        // Optimization: Process in chunks
        const products = await prisma.product.findMany({
            include: { card: true }
        });

        console.log(`Found ${products.length} products to check.`);
        let updatedCount = 0;

        for (const p of products) {
            // Skip if already has full identity data (check if colorIdentity is populated)
            // But we can be aggressive and update anyway to fix "Mana Cost: null" issues
            if (p.card && p.card.colorIdentity && p.card.colorIdentity.length >= 0 && p.card.manaCost !== null) {
                // Seems valid, skip to save time? 
                // Let's verify one field like manaCost. If null, update.
                if (p.card.manaCost !== null && p.card.manaCost !== undefined) {
                    process.stdout.write('.');
                    continue;
                }
            }

            console.log(`\nBackfilling: ${p.name} (${p.set})`);

            try {
                // Fetch from Scryfall
                // Use exact name match if possible. 
                // Scryfall fuzzy search is safer for slight variations.
                const searchRes = await axios.get(`https://api.scryfall.com/cards/named`, {
                    params: { exact: p.name }
                }).catch(async () => {
                    // Fallback to fuzzy
                    return await axios.get(`https://api.scryfall.com/cards/named`, {
                        params: { fuzzy: p.name }
                    });
                });

                const data = searchRes.data;
                if (!data) {
                    console.log(`  [Skip] Not found on Scryfall.`);
                    continue;
                }

                // Prepare Identity Data
                // Handle faces for oracle text/mana cost if split
                const oracleText = data.oracle_text || data.card_faces?.map((f: any) => f.oracle_text).join('\n//\n') || '';
                const manaCost = data.mana_cost || data.card_faces?.map((f: any) => f.mana_cost).join(' // ') || '';
                const typeLine = data.type_line || data.card_faces?.map((f: any) => f.type_line).join(' // ') || '';
                const colors = data.colors || data.card_faces?.[0]?.colors || [];
                const colorIdentity = data.color_identity || [];

                // Upsert Card
                const card = await prisma.card.upsert({
                    where: { oracleId: data.oracle_id },
                    update: {
                        manaCost,
                        manaValue: data.cmc,
                        colors,
                        colorIdentity,
                        typeLine,
                        oracleText,
                        legalities: data.legalities,
                        supertypes: [], // Parse if needed
                        subtypes: [],
                        power: data.power,
                        toughness: data.toughness,
                        loyalty: data.loyalty
                    },
                    create: {
                        oracleId: data.oracle_id,
                        name: data.name,
                        oracleText: oracleText,
                        legalities: data.legalities,
                        manaCost,
                        manaValue: data.cmc,
                        colors,
                        colorIdentity,
                        typeLine,
                        power: data.power,
                        toughness: data.toughness,
                        loyalty: data.loyalty
                    }
                });

                // Link Product to Card
                if (p.cardId !== card.id) {
                    await prisma.product.update({
                        where: { id: p.id },
                        data: { cardId: card.id }
                    });
                    console.log(`  [Linked] Linked to Card ID: ${card.id}`);
                } else {
                    console.log(`  [Updated] Card data refreshed.`);
                }

                updatedCount++;
                // Rate limit respect (100ms)
                await new Promise(r => setTimeout(r, 100));

            } catch (err) {
                console.error(`  [Error] Failed to update ${p.name}: ${err.message}`);
            }
        }

        console.log(`\nBackfill Complete. Updated ${updatedCount} products.`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

backfillCards();
