const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCryparion() {
    console.log('Creating Cryparion...');
    try {
        // Find a store first
        let store = await prisma.store.findFirst();
        if (!store) {
            store = await prisma.store.create({
                data: { name: 'Default Store', apiKey: 'default-key' }
            });
        }

        const product = await prisma.product.create({
            data: {
                storeId: store.id,
                name: 'Cryparion',
                description: 'The requested card',
                variants: {
                    create: [{
                        name: 'Standard',
                        price: 99.99,
                        sku: 'CRYP-001',
                        condition: 'MINT',
                        isFoil: true,
                        inventory: { create: { storeId: store.id, quantity: 1 } }
                    }]
                }
            }
        });
        console.log('✅ Created Cryparion:', product.id);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

createCryparion();
