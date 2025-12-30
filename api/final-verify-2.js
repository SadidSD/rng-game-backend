const { PrismaClient } = require('@prisma/client');
const pw = encodeURIComponent('itsyourSD@123');

// Try Full User on 5432
const url = `postgresql://postgres.lalcsglawekqukzvpyjd:${pw}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

async function verify() {
    console.log('Testing Full User on 5432...');
    try {
        const c = new PrismaClient({ datasources: { db: { url } } });
        await c.$connect();
        console.log('✅ SUCCESS! Full user works on 5432.');
        await c.$disconnect();
    } catch (e) { console.log('❌ FAILED:', e.message.split('\n').pop()); }
}
verify();
