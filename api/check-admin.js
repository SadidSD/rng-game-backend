const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAdmin() {
    try {
        console.log('🔍 Checking for admin@tcg.com...\n');

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: 'admin@tcg.com' }
        });

        if (!user) {
            console.log('❌ User NOT FOUND in database!');
            console.log('\n💡 The database might have been wiped during deployment.');
            console.log('   You need to create a new admin user.\n');
            return;
        }

        console.log('✅ User FOUND!');
        console.log('📧 Email:', user.email);
        console.log('🆔 ID:', user.id);
        console.log('👤 Role:', user.role);
        console.log('🏪 Store ID:', user.storeId);
        console.log('🔐 Password Hash (first 20 chars):', user.password.substring(0, 20) + '...');
        console.log('📅 Created:', user.createdAt);
        console.log('📝 Updated:', user.updatedAt);

        // Check if store exists
        const store = await prisma.store.findUnique({
            where: { id: user.storeId }
        });

        console.log('\n🏪 Store Status:', store ? '✅ EXISTS' : '❌ NOT FOUND');
        if (store) {
            console.log('   Store Name:', store.name);
        }

        // Test password verification (with common passwords)
        console.log('\n🧪 Testing common passwords...');
        const commonPasswords = ['password', 'admin123', 'Admin123', 'admin', '123456', 'test123'];

        for (const testPassword of commonPasswords) {
            const match = await bcrypt.compare(testPassword, user.password);
            if (match) {
                console.log(`✅ PASSWORD MATCH: "${testPassword}"`);
                return;
            }
        }

        console.log('❌ None of the common passwords matched.');
        console.log('\n💡 The password might be custom or the hash is corrupted.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
