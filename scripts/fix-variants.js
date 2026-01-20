const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../.env' }); // Load env from parent if running from scripts dir or adapt
// Actually we try standard loading
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for products without variants...');
    const products = await prisma.product.findMany({
        include: { variants: true }
    });

    let fixedCount = 0;

    for (const p of products) {
        if (p.variants.length === 0) {
            console.log(`Fixing product: ${p.name} (ID: ${p.id})`);
            try {
                // Create a default variant
                await prisma.productVariant.create({
                    data: {
                        productId: p.id,
                        storeId: p.storeId,
                        condition: 'NM',
                        price: p.price, // Use product base price
                        isFoil: false,
                        language: 'English',
                        inventory: {
                            create: {
                                quantity: 50, // Default stock
                                storeId: p.storeId
                            }
                        }
                    }
                });
                console.log(`Created NM variant for ${p.name}`);
                fixedCount++;
            } catch (e) {
                console.error(`Failed to fix ${p.name}:`, e);
            }
        }
    }

    console.log(`Finished. Fixed ${fixedCount} products.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
