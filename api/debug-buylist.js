const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Stores ---');
    const stores = await prisma.store.findMany();
    console.log('Stores:', JSON.stringify(stores, null, 2));

    console.log('\nKeys:');
    const keys = await prisma.apiKey.findMany(); // Redundant fetch but ok
    console.log(JSON.stringify(keys.map(k => ({ id: k.id, name: k.name, storeId: k.storeId })), null, 2));

    console.log('\nUsers:');
    const users = await prisma.user.findMany();
    console.log(JSON.stringify(users.map(u => ({ email: u.email, role: u.role, storeId: u.storeId })), null, 2));

    console.log('\nOffers:');
    const offers = await prisma.buylistOffer.findMany({
        include: { items: true }
    });
    if (offers.length === 0) {
        console.log("No offers found in DB.");
    } else {
        console.log(JSON.stringify(offers.map(o => ({
            id: o.id,
            email: o.customerEmail,
            status: o.status,
            storeId: o.storeId,
            items: o.items.length
        })), null, 2));
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
