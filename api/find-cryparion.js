const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCryparion() {
    const product = await prisma.product.findFirst({
        where: { name: 'Cryparion' },
        include: { variants: true }
    });

    if (product) {
        console.log('FOUND:', JSON.stringify(product, null, 2));
    } else {
        console.log('NOT FOUND');
    }
}

findCryparion()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
