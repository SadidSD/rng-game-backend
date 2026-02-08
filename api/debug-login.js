const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging Login for admin@tcg.com...');

    const email = 'admin@tcg.com';
    const password = 'password123';

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('❌ User NOT FOUND in DB.');
        return;
    }
    console.log(`✅ User Found: ${user.id} | Role: ${user.role} | Store: ${user.storeId}`);
    console.log(`🔑 Stored Hash: ${user.password.substring(0, 10)}...`);

    // 2. Compare Password
    console.log(`Checking password '${password}'...`);
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
        console.log('✅ Password MATCHES!');
    } else {
        console.log('❌ Password DOES NOT MATCH.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
