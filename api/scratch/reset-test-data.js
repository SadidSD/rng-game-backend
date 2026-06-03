const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const envPath = 'f:\\Projects\\TCG Website\\TCG-Backend\\api\\.env.production';
if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production NOT FOUND!');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        envVars[key] = value;
    }
});

const dbUrl = envVars.DATABASE_URL;
const targetOfferId = 'c79640b9-4e61-40f7-af13-6c6c0ff6a6ff';

async function main() {
    const prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } }
    });

    try {
        console.log('🔄 Resetting offer and customer balance in database...');
        
        const offer = await prisma.buylistOffer.update({
            where: { id: targetOfferId },
            data: { status: 'PENDING' }
        });
        console.log(`✅ Offer status reset to: ${offer.status}`);

        const customer = await prisma.customer.update({
            where: { storeId_email: { storeId: offer.storeId, email: offer.customerEmail } },
            data: { creditBalance: 0 }
        });
        console.log(`✅ Customer credit balance reset to: $${customer.creditBalance}`);

        // Reset inventory to 100 just in case
        const product = await prisma.product.findFirst({
            where: { name: 'Black Lotus', storeId: offer.storeId }
        });
        if (product) {
            const variant = await prisma.productVariant.findFirst({
                where: { productId: product.id, condition: 'NM', isFoil: false }
            });
            if (variant) {
                const inventory = await prisma.inventoryItem.update({
                    where: { variantId: variant.id },
                    data: { quantity: 100 }
                });
                console.log(`✅ Black Lotus NM Inventory reset to: ${inventory.quantity}`);
            }
        }
    } catch (e) {
        console.error('❌ Reset failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
