const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function fixPassword() {
    const password = process.argv[2] || 'itsyourSD@123';
    const email = 'sadidbinhasan3@gmail.com';

    console.log(`🔧 Fixing password for ${email} to "${password}"...`);

    // Load .env.production to get database URL
    const envPath = path.join(__dirname, '.env.production');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*(.*)/);
    if (!dbUrlMatch) {
        console.error('❌ DATABASE_URL NOT FOUND IN .env.production!');
        process.exit(1);
    }
    let dbUrl = dbUrlMatch[1].trim().replace(/^"/, '').replace(/"$/, '').replace(/^'/, '').replace(/'$/, '');
    
    // Use DIRECT_URL since we are running locally
    dbUrl = dbUrl.replace(':6543', ':5432');
    process.env.DATABASE_URL = dbUrl;

    const prisma = new PrismaClient();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log('✅ Password updated successfully!');
        
        // Verify immediately
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🧪 Immediate verification match:', isMatch ? '✅ YES' : '❌ NO');

    } catch (e) {
        console.error('❌ FAILED:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixPassword();
