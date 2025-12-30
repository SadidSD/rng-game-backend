const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getStore() {
    const store = await prisma.store.findFirst();
    if (store) {
        console.log('STORE_ID=' + store.id);
    } else {
        console.log('No store found');
    }
}
getStore();
