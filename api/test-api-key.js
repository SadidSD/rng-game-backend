const { PrismaClient } = require('@prisma/client');

// Ensure stats are logged to debug connection
const prisma = new PrismaClient({
    log: ['error', 'warn']
});
const BASE_URL = 'http://localhost:3000';

async function testApiKey() {
    console.log('🚀 Starting API Key Tests...');

    try {
        console.log('Connecting to Prisma...');
        // 1. Get a valid API Key from DB
        const store = await prisma.store.findFirst();
        if (!store) {
            console.error('❌ No store found in DB. Run Phase 3 auth test first to create one.');
            return;
        }
        const validKey = store.apiKey;
        console.log(`ℹ️ Using API Key: ${validKey.substring(0, 8)}...`);

        // 2. Test Valid Key
        console.log('\n2. Testing GET /public/products with VALID Key...');
        const validRes = await fetch(`${BASE_URL}/public/products`, {
            headers: { 'x-api-key': validKey },
        });

        if (validRes.ok) {
            const data = await validRes.json();
            console.log('✅ Success! Data:', data);
        } else {
            console.error('❌ Failed with Valid Key:', validRes.status, await validRes.text());
        }

        // 3. Test Invalid Key
        console.log('\n3. Testing GET /public/products with INVALID Key...');
        const invalidRes = await fetch(`${BASE_URL}/public/products`, {
            headers: { 'x-api-key': 'invalid-key-123' },
        });

        if (invalidRes.status === 401) {
            console.log('✅ Correctly Rejected (401 Unauthorized)');
        } else {
            console.error('❌ Needed 401, got:', invalidRes.status);
        }

    } catch (e) {
        console.error('---------------- ERROR ----------------');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testApiKey();
