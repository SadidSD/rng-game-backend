"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function debugIdentity() {
    const cards = await prisma.card.findMany({
        where: {
            OR: [
                { name: { contains: 'Hardlight', mode: 'insensitive' } },
                { name: { contains: 'Redirect', mode: 'insensitive' } },
                { name: { contains: 'Sol Ring', mode: 'insensitive' } }
            ]
        },
        select: {
            name: true,
            colorIdentity: true,
            colors: true,
            manaCost: true
        }
    });
    console.log("--- Card Identity Debug ---");
    cards.forEach(c => {
        console.log(`Name: ${c.name}`);
        console.log(`  Identity: ${JSON.stringify(c.colorIdentity)}`);
        console.log(`  Colors: ${JSON.stringify(c.colors)}`);
    });
}
debugIdentity()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=debug-identity.js.map