const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.production
const envPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production NOT FOUND!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        envVars[key] = value;
    }
});

const dbUrl = envVars.DATABASE_URL;

async function run() {
    const prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } }
    });
    try {
        console.log('🔍 Listing all users in Production Database...');
        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true,
                storeId: true,
                createdAt: true
            }
        });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('❌ Failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

run();
