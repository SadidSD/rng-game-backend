const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: {
                store: true // Include store details to give context
            }
        });
        console.log('---------------- USER DATA ----------------');
        console.log(JSON.stringify(users, null, 2));
        console.log('-------------------------------------------');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
