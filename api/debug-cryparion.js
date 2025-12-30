const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCryparion() {
    console.log('--- Debugging Cryparion ---');
    try {
        // 1. Count all products
        const count = await prisma.product.count();
        console.log(`Total Products in DB: ${count}`);

        // 2. Find Cryparion
        const product = await prisma.product.findFirst({
            where: { name: 'Cryparion' },
            include: { store: true }
        });

        if (product) {
            console.log(`✅ FOUND Cryparion!`);
            console.log(`   ID: ${product.id}`);
            console.log(`   Store Name: ${product.store.name}`);
            console.log(`   Store ID: ${product.store.id}`);
        } else {
            console.log(`❌ Cryparion NOT found in the database.`);
            // List what IS there
            const all = await prisma.product.findMany({ select: { name: true, storeId: true } });
            console.log('   Existing Products:', all);
        }

    } catch (e) {
        console.error('❌ Error querying DB:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugCryparion();
