const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️ Clearing all orders...');
    try {
        const deleteOrders = await prisma.order.deleteMany({});
        console.log(`✅ Deleted ${deleteOrders.count} orders.`);

        // Optional: Clear customers if they were just for testing? 
        // User said "previous data", usually implies the test orders.
        // I'll stick to orders for now to be safe, unless they want customers gone too.
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
