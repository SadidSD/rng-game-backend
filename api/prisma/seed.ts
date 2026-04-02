import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Seed...');

    const storeId = process.env.SINGLE_TENANT_STORE_ID;
    if (!storeId) {
        console.error('❌ SINGLE_TENANT_STORE_ID environment variable is required');
        process.exit(1);
    }

    const frontendApiKey = process.env.FRONTEND_API_KEY;
    if (!frontendApiKey) {
        console.error('❌ FRONTEND_API_KEY environment variable is required');
        process.exit(1);
    }

    // 1. Ensure Default Store Exists
    const store = await prisma.store.upsert({
        where: { id: storeId },
        update: {},
        create: {
            id: storeId,
            name: 'TCG Default Store',
            apiKey: frontendApiKey,
        },
    });
    console.log(`✅ Store ensured: ${store.name} (${store.id})`);

    // 2. Ensure Admin User Exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tcg.com';
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'password123', 10);
    console.log(`📧 Admin email: ${adminEmail}`);

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
