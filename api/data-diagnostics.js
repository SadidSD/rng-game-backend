const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- DIAGNOSTICS ---');
    try {
        // 1. Check Cryparion
        const cryp = await prisma.product.findFirst({
            where: { name: 'Cryparion' },
            include: { store: true }
        });
        console.log('Cryparion:', cryp ? `FOUND (Store: ${cryp.store.name}, ID: ${cryp.store.id})` : 'NOT FOUND');

        // 2. List All Stores & Product Counts
        const stores = await prisma.store.findMany({
            include: { _count: { select: { products: true } } }
        });
        console.log('\n--- STORES ---');
        stores.forEach(s => {
            console.log(`- [${s.id}] ${s.name}: ${s._count.products} products`);
        });

        // 3. Test API Response (simulating Frontend)
        console.log('\n--- API CHECK ---');
        try {
            const response = await fetch('http://localhost:3001/api/products'); // Public endpoint?
            if (response.ok) {
                const data = await response.json();
                const products = Array.isArray(data) ? data : (data.data || []);
                console.log(`API returned ${products.length} products`);
                const foundInApi = products.find(p => p.name === 'Cryparion');
                console.log('Cryparion in API response:', foundInApi ? 'YES' : 'NO');
                if (products.length > 0) console.log('Sample API item:', products[0].name);
            } else {
                console.log('API Error:', response.status);
            }
        } catch (err) {
            console.log('API Fetch Failed:', err.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
