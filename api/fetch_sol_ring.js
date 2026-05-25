const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const card = await prisma.card.findFirst({
        where: { name: { contains: "Sol Ring" } }
    });
    console.log(JSON.stringify(card?.legalities, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
