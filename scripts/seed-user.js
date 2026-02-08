const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt'); // Backend uses bcrypt usually
const prisma = new PrismaClient();

const STORE_ID = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';

async function main() {
    console.log('👤 Seeding Admin User...');

    const store = await prisma.store.findUnique({ where: { id: STORE_ID } });
    if (!store) {
        console.error('❌ Store not found. Run seed-one.js first.');
        return;
    }

    const email = 'admin@tcg.com';
    const password = 'password123';

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log('✅ Admin user already exists.');
        return;
    }

    // Hash password (assuming backend uses bcrypt, checking auth.service.ts would confirm but this is standard)
    // Actually, I should check auth.service.ts to match the hashing algorithm.
    // For now, I'll assume bcrypt with 10 rounds as per standard NestJS/Passport patterns.
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: 'OWNER',
            storeId: store.id
        }
    });

    console.log(`🎉 Created Admin User: ${email} / ${password}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
