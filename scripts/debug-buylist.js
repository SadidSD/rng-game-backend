const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Stores ---');
    const stores = await prisma.store.findMany();
    console.table(stores.map(s => ({ id: s.id, name: s.name })));

    console.log('\n--- API Keys ---');
    // We can't see the raw key, but we can see the store linkage
    const keys = await prisma.apiKey.findMany();
    console.table(keys.map(k => ({ id: k.id, name: k.name, storeId: k.storeId })));

    console.log('\n--- Users (Admins) ---');
    const users = await prisma.user.findMany();
    console.table(users.map(u => ({ email: u.email, role: u.role, storeId: u.storeId })));

    console.log('\n--- Buylist Offers ---');
    const offers = await prisma.buylistOffer.findMany({
        include: { items: true }
    });
    if (offers.length === 0) {
        console.log("No offers found in DB.");
    } else {
        console.table(offers.map(o => ({
            id: o.id,
            email: o.customerEmail,
            status: o.status,
            storeId: o.storeId,
            items: o.items.length
        })));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
