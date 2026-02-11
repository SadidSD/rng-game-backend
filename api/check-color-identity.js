const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColorIdentity() {
    console.log('🔍 Checking colorIdentity values in database...\n');

    // 1. Check specific card (Hardlight Containment)
    const hardlight = await prisma.card.findMany({
        where: { name: { contains: 'Hardlight', mode: 'insensitive' } },
        select: { name: true, colorIdentity: true, manaCost: true, typeLine: true }
    });

    console.log('📄 Hardlight Containment:');
    console.log(JSON.stringify(hardlight, null, 2));

    // 2. Check sample of cards with different colors
    const sampleCards = await prisma.card.findMany({
        select: { name: true, colorIdentity: true, manaCost: true },
        take: 20
    });

    console.log('\n📋 Sample cards colorIdentity:');
    sampleCards.forEach(card => {
        console.log(`${card.name}: ${JSON.stringify(card.colorIdentity)} (${card.manaCost || 'N/A'})`);
    });

    // 3. Check products with cards
    const whiteProducts = await prisma.product.findMany({
        where: {
            card: {
                colorIdentity: { hasSome: ['W'] }
            }
        },
        include: {
            card: { select: { name: true, colorIdentity: true, manaCost: true } }
        },
        take: 5
    });

    console.log('\n⚪ Products with white colorIdentity (hasSome [W]):');
    console.log(JSON.stringify(whiteProducts.map(p => ({
        name: p.name,
        colorIdentity: p.card?.colorIdentity
    })), null, 2));

    await prisma.$disconnect();
}

checkColorIdentity().catch(console.error);
