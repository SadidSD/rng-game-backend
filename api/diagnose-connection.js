const { PrismaClient } = require('@prisma/client');

const password = encodeURIComponent('itsyourSD@123');
const variants = [
    { name: 'db_host_5432', url: `postgresql://postgres:${password}@db.lalcsglawekqukzvpyjd.supabase.co:5432/postgres` },
    { name: 'aws0_5432', url: `postgresql://postgres.lalcsglawekqukzvpyjd:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres` },
    { name: 'aws0_6543', url: `postgresql://postgres.lalcsglawekqukzvpyjd:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true` },
];

async function testAll() {
    console.log('--- Connection Diagnostics ---');
    for (const v of variants) {
        process.stdout.write(`Testing ${v.name}... `);
        const prisma = new PrismaClient({ datasources: { db: { url: v.url } } });
        try {
            await prisma.$connect();
            console.log('✅ SUCCESS');
            try {
                await prisma.product.count();
                console.log('   (Table access OK)');
            } catch (e) { console.log('   (Table missing/access error)'); }
            await prisma.$disconnect();

            // If success, print the URL to use (hidden pw if needed, but for now exact)
            console.log(`RECOMMENDED URL: ${v.url}`);
            return; // Stop after first success
        } catch (e) {
            console.log(`❌ FAILED (${e.message.split('\n').pop()})`);
        }
    }
    console.log('All variations failed.');
}

testAll();
