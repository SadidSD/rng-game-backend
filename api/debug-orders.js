const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.order.count();
    console.log('Order count:', count);
    const orders = await prisma.order.findMany();
    console.log('Orders:', orders);
}

main().finally(() => prisma.$disconnect());
