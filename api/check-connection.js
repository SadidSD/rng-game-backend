const { PrismaClient } = require('@prisma/client');

async function check() {
    console.log('--- Testing Database Connection ---');
    // Load env (Prisma does this, but we want to fail fast)
    try {
        const prisma = new PrismaClient();
        console.log('1. Attempting to connect...');
        await prisma.$connect();
        console.log('✅ Connection Successful!');

        console.log('2. Checking for tables...');
        const count = await prisma.product.count().catch(() => 'Table missing');
        console.log(count === 'Table missing' ? '❌ Product Table Missing (Run db push)' : `✅ Found ${count} products`);

        await prisma.$disconnect();
    } catch (e) {
        console.error('❌ Connection FAILED:', e.message);
        console.log('\nTip: Check your DATABASE_URL in the .env file.');
    }
}

check();
