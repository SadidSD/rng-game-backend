const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
    try {
        console.log('🔐 Admin Password Reset Tool\n');

        const email = 'admin@tcg.com';
        const newPassword = await askQuestion('Enter new password for admin@tcg.com: ');

        if (!newPassword || newPassword.length < 6) {
            console.log('❌ Password must be at least 6 characters long');
            rl.close();
            return;
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log('\n✅ Password reset successfully!');
        console.log('📧 Email: admin@tcg.com');
        console.log('🔑 New Password: ' + '*'.repeat(newPassword.length));
        console.log('\nYou can now log in with this password.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

resetPassword();
