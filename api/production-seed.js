const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function seed() {
    console.log('🌱 Starting Production Seeding...');
    
    // We expect DATABASE_URL and other vars to be in the environment
    const prisma = new PrismaClient();

    try {
        const storeId = process.env.SINGLE_TENANT_STORE_ID;
        const frontendApiKey = process.env.FRONTEND_API_KEY;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'password123';

        if (!storeId || !frontendApiKey || !adminEmail) {
            throw new Error(`Missing required environment variables: STORE_ID=${!!storeId}, API_KEY=${!!frontendApiKey}, ADMIN_EMAIL=${!!adminEmail}`);
        }

        console.log(`1. Ensuring Store: ${storeId}`);
        const store = await prisma.store.upsert({
            where: { id: storeId },
            update: {
                name: 'TCG Production Store',
                apiKey: frontendApiKey
            },
            create: {
                id: storeId,
                name: 'TCG Production Store',
                apiKey: frontendApiKey
            }
        });
        console.log(`✅ Store Ready: ${store.id}`);

        console.log(`2. Ensuring Admin: ${adminEmail}`);
        const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);
        
        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                storeId: store.id
            },
            create: {
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN',
                storeId: store.id
            }
        });
        console.log(`✅ Admin Ready: ${admin.email}`);

    } catch (e) {
        console.error('❌ Seeding FAILED:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
