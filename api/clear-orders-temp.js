const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Clearing all orders...');
    try {
        const deleteOrders = await prisma.order.deleteMany({});
        console.log(`✅ Deleted ${deleteOrders.count} orders.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
