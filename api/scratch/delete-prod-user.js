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
        console.log('🔍 Locating admin@tcg.com for deletion...');
        const user = await prisma.user.findUnique({
            where: { email: 'admin@tcg.com' }
        });
        if (!user) {
            console.log('⚠️ user admin@tcg.com not found in database. Nothing to delete.');
            return;
        }

        console.log('🚀 Deleting admin@tcg.com...');
        await prisma.user.delete({
            where: { email: 'admin@tcg.com' }
        });
        console.log('✅ admin@tcg.com user account successfully deleted!');
    } catch (e) {
        console.error('❌ Failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

run();
