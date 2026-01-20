const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- REPLENISHING STOCK ---');
    const variants = await prisma.productVariant.findMany({
        include: { inventory: true, product: true }
    });

    console.log(`Found ${variants.length} variants.`);

    let updatedCount = 0;

    for (const v of variants) {
        // If no inventory record, create it. If exists, update it.
        // Actually schema says Variant has one Inventory? Or 1-to-1?
        // Let's check if v.inventory is null or array.
        // Usually it's 1-to-1? 
        // Based on previous code: `include: { inventory: true }` returned an object or null?
        // Let's try upsert logic.

        try {
            // Find inventory for this variant
            const inventory = await prisma.inventoryItem.findUnique({
                where: { variantId: v.id }
            });

            if (inventory) {
                // Force update all to 500
                await prisma.inventoryItem.update({
                    where: { id: inventory.id },
                    data: { quantity: 500 }
                });
                if (v.product.name.includes('Mass')) {
                    console.log(`!!! FORCE UPDATE STOCK FOR ${v.product.name} (${v.condition}) !!!`);
                }
                updatedCount++;
            } else {
                await prisma.inventoryItem.create({
                    data: {
                        variantId: v.id,
                        storeId: v.storeId,
                        quantity: 500
                    }
                });
                console.log(`Created stock for ${v.product.name} (${v.condition}) -> 500.`);
                updatedCount++;
            }
        } catch (e) {
            console.error(`Failed to update ${v.id}:`, e.message);
        }
    }

    console.log(`Replenished stock for ${updatedCount} variants.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
