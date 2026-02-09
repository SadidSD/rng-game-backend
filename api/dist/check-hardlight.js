"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkCard() {
    try {
        console.log("Searching for 'Hardlight Containment'...");
        const products = await prisma.product.findMany({
            where: {
                name: {
                    contains: 'Hardlight Containment',
                    mode: 'insensitive'
                }
            },
            include: {
                card: true
            }
        });
        if (products.length === 0) {
            console.log("No product found with name 'Hardlight Containment'.");
            const cards = await prisma.card.findMany({
                where: {
                    name: {
                        contains: 'Hardlight Containment',
                        mode: 'insensitive'
                    }
                }
            });
            if (cards.length > 0) {
                console.log("Found in CARD table directly (maybe not linked to Product yet?):");
                console.dir(cards, { depth: null });
            }
            else {
                console.log("Not found in Card table either.");
            }
            return;
        }
        console.log(`Found ${products.length} product(s). Inspecting the first one:\n`);
        const p = products[0];
        console.log("--- PRODUCT DATA ---");
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`Set: ${p.set}`);
        console.log(`Card ID Relation: ${p.cardId}`);
        if (p.card) {
            console.log("\n--- RELATED CARD DATA (Identity Check) ---");
            console.log(`Oracle ID: ${p.card.oracleId}`);
            console.log(`Mana Cost: ${p.card.manaCost}`);
            console.log(`Mana Value: ${p.card.manaValue}`);
            console.log(`Colors: ${JSON.stringify(p.card.colors)}`);
            console.log(`Color Identity: ${JSON.stringify(p.card.colorIdentity)}`);
            console.log(`Type Line: ${p.card.typeLine}`);
            console.log(`Legalities: ${JSON.stringify(p.card.legalities)}`);
        }
        else {
            console.log("\n[WARNING] Product exists but has NO related Card data linked!");
        }
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkCard();
//# sourceMappingURL=check-hardlight.js.map