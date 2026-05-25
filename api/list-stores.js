const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listStores() {
    try {
        const stores = await prisma.store.findMany();
        console.log(JSON.stringify(stores, null, 2));
    } catch (error) {
        console.error('Error fetching stores:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listStores();
