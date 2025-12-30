const { PrismaClient } = require('@prisma/client');

// Password: itsyourSD@123 -> Encoded: itsyourSD%40123
const url = "postgresql://postgres:itsyourSD%40123@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

console.log('Testing IPv4 Direct URL:', url);

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function test() {
    try {
        await prisma.$connect();
        console.log('✅ SUCCESS! Access granted.');

        // Write this to .env immediately if successful
        const fs = require('fs');
        fs.writeFileSync('.env', `DATABASE_URL="${url}"\nJWT_SECRET="super-secret-key-change-me"\n`);
        console.log('✅ .env updated automatically.');

    } catch (e) {
        console.log('❌ FAILED:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
