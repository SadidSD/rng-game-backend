"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
async function backfillCards() {
    try {
        console.log("Starting Bulk Card Backfill...");
        const products = await prisma.product.findMany({
            include: { card: true }
        });
        console.log(`Found ${products.length} products to check.`);
        let updatedCount = 0;
        for (const p of products) {
            if (p.card && p.card.colorIdentity && p.card.colorIdentity.length >= 0 && p.card.manaCost !== null) {
                if (p.card.manaCost !== null && p.card.manaCost !== undefined) {
                    process.stdout.write('.');
                    continue;
                }
            }
            console.log(`\nBackfilling: ${p.name} (${p.set})`);
            try {
                const searchRes = await axios_1.default.get(`https://api.scryfall.com/cards/named`, {
                    params: { exact: p.name }
                }).catch(async () => {
                    return await axios_1.default.get(`https://api.scryfall.com/cards/named`, {
                        params: { fuzzy: p.name }
                    });
                });
                const data = searchRes.data;
                if (!data) {
                    console.log(`  [Skip] Not found on Scryfall.`);
                    continue;
                }
                const oracleText = data.oracle_text || data.card_faces?.map((f) => f.oracle_text).join('\n//\n') || '';
                const manaCost = data.mana_cost || data.card_faces?.map((f) => f.mana_cost).join(' // ') || '';
                const typeLine = data.type_line || data.card_faces?.map((f) => f.type_line).join(' // ') || '';
                const colors = data.colors || data.card_faces?.[0]?.colors || [];
                const colorIdentity = data.color_identity || [];
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
                        supertypes: [],
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
                if (p.cardId !== card.id) {
                    await prisma.product.update({
                        where: { id: p.id },
                        data: { cardId: card.id }
                    });
                    console.log(`  [Linked] Linked to Card ID: ${card.id}`);
                }
                else {
                    console.log(`  [Updated] Card data refreshed.`);
                }
                updatedCount++;
                await new Promise(r => setTimeout(r, 100));
            }
            catch (err) {
                console.error(`  [Error] Failed to update ${p.name}: ${err.message}`);
            }
        }
        console.log(`\nBackfill Complete. Updated ${updatedCount} products.`);
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await prisma.$disconnect();
    }
}
backfillCards();
//# sourceMappingURL=backfill-cards.js.map