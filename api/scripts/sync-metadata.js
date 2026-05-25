const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function syncMetadata() {
    console.log("Starting Card Metadata Sync...");

    try {
        const cards = await prisma.card.findMany();
        console.log(`Found ${cards.length} cards to process.`);

        for (const card of cards) {
            console.log(`Processing: ${card.name} (${card.oracleId})`);

            try {
                // MTG / Scryfall logic (if it has an oracle_id)
                if (card.oracleId && !card.oracleId.includes('-')) { // Rough check for Pokemon TCG IDs which look like 'base1-1'
                    const res = await axios.get(`https://api.scryfall.com/cards/oracle/${card.oracleId}`);
                    const data = res.data;

                    const oracleText = data.oracle_text || data.card_faces?.map(f => f.oracle_text).join('\n//\n') || '';
                    const manaCost = data.mana_cost || data.card_faces?.map(f => f.mana_cost).join(' // ') || '';
                    const typeLine = data.type_line || data.card_faces?.map(f => f.type_line).join(' // ') || '';

                    await prisma.card.update({
                        where: { id: card.id },
                        data: {
                            oracleText,
                            manaCost,
                            manaValue: data.cmc || 0,
                            colors: data.colors || [],
                            colorIdentity: data.color_identity || [],
                            typeLine,
                            power: data.power,
                            toughness: data.toughness,
                            loyalty: data.loyalty,
                            legalities: data.legalities
                        }
                    });
                    console.log(`  - Updated MTG meta for: ${card.name}`);

                } else if (card.oracleId && card.oracleId.includes('-')) {
                    // Pokemon Logic (oracleId contains set code like 'base1-70')
                    const res = await axios.get(`https://api.pokemontcg.io/v2/cards/${card.oracleId}`);
                    const data = res.data.data;

                    const oracleText = [
                        ...(data.rules || []),
                        ...(data.abilities || []).map(a => `[Ability] ${a.name}: ${a.text}`),
                        ...(data.attacks || []).map(a => `[Attack] ${a.name} (${a.cost.join(', ')}): ${a.text}`)
                    ].join('\n\n');

                    const typeLine = [data.supertype, ...(data.subtypes || []), data.types ? `(${data.types.join('/')})` : ''].filter(Boolean).join(' ');

                    await prisma.card.update({
                        where: { id: card.id },
                        data: {
                            oracleText,
                            typeLine,
                            manaValue: data.hp ? parseInt(data.hp) : 0,
                            colors: data.types || []
                        }
                    });
                    console.log(`  - Updated Pokemon meta for: ${card.name}`);
                }
            } catch (err) {
                console.error(`  - FAILED to update ${card.name}: ${err.message}`);
            }

            // Rate limit friendliness
            await new Promise(r => setTimeout(r, 100));
        }

        console.log("--- Sync COMPLETED Successfully! ---");

    } catch (err) {
        console.error("FATAL ERROR in Sync Script:", err);
    } finally {
        await prisma.$disconnect();
    }
}

syncMetadata();
