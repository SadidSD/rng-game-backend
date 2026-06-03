const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING ORDER ITEM SKU FIXES ---');
    const orderItems = await prisma.orderItem.findMany({
        where: { NOT: { variantId: null } }
    });

    console.log(`Found ${orderItems.length} order items with variant IDs.`);

    let fixedCount = 0;

    for (const item of orderItems) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId }
        });

        if (variant && variant.sku && item.variantSku !== variant.sku) {
            await prisma.orderItem.update({
                where: { id: item.id },
                data: { variantSku: variant.sku }
            });
            console.log(`✓ Updated OrderItem SKU for ${item.productName}: ${item.variantSku} → ${variant.sku}`);
            fixedCount++;
        }
    }

    console.log(`Total OrderItems updated: ${fixedCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
