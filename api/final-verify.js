const { PrismaClient } = require('@prisma/client');
const pw = encodeURIComponent('itsyourSD@123');

// 1. Session Mode (IPv4) - User 'postgres'
const sessionUrl = `postgresql://postgres:${pw}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
// 2. Transaction Mode (IPv4) - User 'postgres.project'
const transactionUrl = `postgresql://postgres.lalcsglawekqukzvpyjd:${pw}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;

async function verify() {
    console.log('--- FINAL VERIFICATION ---');

    // Test Session
    try {
        const c1 = new PrismaClient({ datasources: { db: { url: sessionUrl } } });
        await c1.$connect();
        console.log('✅ Session URL (5432) works!');
        await c1.$disconnect();
    } catch (e) { console.log('❌ Session URL failed:', e.message.split('\n').pop()); }

    // Test Transaction
    try {
        const c2 = new PrismaClient({ datasources: { db: { url: transactionUrl } } });
        await c2.$connect();
        console.log('✅ Transaction URL (6543) works!');
        await c2.$disconnect();
    } catch (e) { console.log('❌ Transaction URL failed:', e.message.split('\n').pop()); }
}

verify();
