import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Seed...');

    const storeId = process.env.SINGLE_TENANT_STORE_ID || 'd02dbcba-81b5-4f9d-831c-54fe9a803081';

    // 1. Ensure Default Store Exists
    const store = await prisma.store.upsert({
        where: { id: storeId },
        update: {},
        create: {
            id: storeId,
            name: 'TCG Default Store',
            apiKey: 'tcg-frontend-secret-key', // Matching the guard fallback
        },
    });
    console.log(`✅ Store ensured: ${store.name} (${store.id})`);

    // 2. Ensure Admin User Exists
    const adminEmail = 'admin@tcg.com';
    const adminPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: Role.ADMIN, // Ensure they are admin
            storeId: store.id,
        },
        create: {
            email: adminEmail,
            password: adminPassword,
            role: Role.ADMIN,
            storeId: store.id,
        },
    });
    console.log(`✅ Admin ensured: ${admin.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
