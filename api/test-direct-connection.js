const { PrismaClient } = require('@prisma/client');

const url = "postgresql://postgres:itsyourSD%40123@db.lalcsglawekqukzvpyjd.supabase.co:5432/postgres";
console.log("Testing connection to:", url);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url
        }
    }
});

async function main() {
    try {
        await prisma.$connect();
        console.log("✅ Connection Successful!");
        const count = await prisma.product.count();
        console.log("Count:", count);
    } catch (e) {
        console.error("❌ Connection Failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
