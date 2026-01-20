const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING DIAGNOSTICS ---');
    const products = await prisma.product.findMany({
        include: { variants: true }
    });

    console.log(`Total Products: ${products.length}`);

    if (products.length === 0) {
        console.log('No products found in database.');
        return;
    }

    const withVariants = products.filter(p => p.variants.length > 0);
    const withoutVariants = products.filter(p => p.variants.length === 0);

    console.log(`Products with variants: ${withVariants.length}`);
    console.log(`Products without variants: ${withoutVariants.length}`);

    if (withoutVariants.length > 0) {
        console.log(`Fixing ${withoutVariants.length} products...`);
        for (const p of withoutVariants) {
            try {
                await prisma.productVariant.create({
                    data: {
                        product: { connect: { id: p.id } },
                        storeId: p.storeId,
                        condition: 'NM',
                        price: p.price || 0.0,
                        isFoil: false,
                        inventory: {
                            create: { quantity: 50, storeId: p.storeId }
                        }
                    }
                });
                console.log(`+ Fixed: ${p.name}`);
            } catch (e) {
                console.error(`x Failed ${p.name}: ${e.message}`);
            }
        }
    } else {
        console.log('All products have variants. No fix needed.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
