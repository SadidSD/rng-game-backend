const { PrismaClient } = require('@prisma/client');
const pw = encodeURIComponent('itsyourSD@123');

// 1. User's URL (Invalid)
const userUrl = `postgresql://postgres:itsyourSD%40123@db.lalcsglawekqukzvpyjd.supabase.co:6543/postgres`;
// 2. Correct URL (Valid)
const correctUrl = `postgresql://postgres.lalcsglawekqukzvpyjd:${pw}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;

async function test() {
    console.log('--- PROOF OF CONNECTION ---');
    console.log(`1. Testing YOUR URL (db...:6543)...`);
    try {
        const c1 = new PrismaClient({ datasources: { db: { url: userUrl } } });
        await c1.$connect();
        console.log('   ✅ SURPRISE: It worked? (Unexpected)');
        await c1.$disconnect();
    } catch (e) {
        console.log('   ❌ FAILED: Can\'t reach database server');
    }

    console.log(`2. Testing CORRECT URL (aws-0...:6543)...`);
    try {
        const c2 = new PrismaClient({ datasources: { db: { url: correctUrl } } });
        await c2.$connect();
        console.log('   ✅ SUCCESS: Connection established!');
        await c2.$disconnect();
    } catch (e) {
        console.log('   ❌ FAILED: ' + e.message.split('\n').pop());
    }
}

test();
