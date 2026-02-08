const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        const stores = await prisma.store.findMany();
        console.log('--- FOUND STORES ---');
        console.table(stores);

        const envStoreId = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';
        console.log(`\nConfigured Store ID: ${envStoreId}`);

        const match = stores.find(s => s.id === envStoreId);
        if (match) {
            console.log('✅ Configured Store ID exists in DB.');
        } else {
            console.log('❌ Configured Store ID DOES NOT EXIST in DB.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
