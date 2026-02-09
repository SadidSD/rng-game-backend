
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function updateCard() {
    try {
        console.log("Updating 'Hardlight Containment'...");

        // 1. Fetch from Scryfall
        const response = await axios.get('https://api.scryfall.com/cards/named?exact=Hardlight+Containment');
        const data = response.data;

        if (!data) {
            console.log("Card not found on Scryfall.");
            return;
        }

        console.log(`Fetched from Scryfall: ${data.name}`);
        console.log(`Mana Cost: ${data.mana_cost}`);
        console.log(`Colors: ${data.colors}`);
        console.log(`Color Identity: ${data.color_identity}`);

        // 2. Update DB
        // Find the card by Oracle ID or Name
        const updatedCard = await prisma.card.upsert({
            where: { oracleId: data.oracle_id },
            update: {
                manaCost: data.mana_cost,
                manaValue: data.cmc,
                colors: data.colors || [],
                colorIdentity: data.color_identity || [],
                typeLine: data.type_line,
                oracleText: data.oracle_text,
                legalities: data.legalities
            },
            create: {
                oracleId: data.oracle_id,
                name: data.name,
                oracleText: data.oracle_text || '',
                legalities: data.legalities,
                // New Fields
                manaCost: data.mana_cost,
                manaValue: data.cmc,
                colors: data.colors || [],
                colorIdentity: data.color_identity || [],
                typeLine: data.type_line,
            }
        });

        console.log("Database Updated Successfully:");
        console.log(updatedCard);

        // Link products to this card if needed
        await prisma.product.updateMany({
            where: { name: { contains: 'Hardlight Containment', mode: 'insensitive' } },
            data: { cardId: updatedCard.id }
        });
        console.log("Linked products to updated Card identity.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

updateCard();
