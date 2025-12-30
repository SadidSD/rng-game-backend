// verify-db-direct.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Starting Direct Database Verification...');

    try {
        // 1. Create a Store
        const storeName = `DB Check Store ${Date.now()}`;
        console.log(`1. Creating Store: "${storeName}"...`);

        // We need a dummy user to own the store? 
        // The schema says Store has ownerId which links to User? 
        // Let's check schema... User has storeId. Store has... 
        // user Store[] @relation("StoreOwner") ?? 
        // Let's just look at what's required.
        // Based on previous phases, we usually create Store first or with User.
        // Let's try creating a Store directly. 
        // Checking Schema in memory: Store { id, name, apiKey, ... }

        const store = await prisma.store.create({
            data: {
                name: storeName,
                apiKey: `test-key-${Date.now()}`,
                // ownerId might be optional or handled differently?
                // Let's create a Users on the fly if needed. 
                // Actually, User belongs to Store. Store might have ownerId.
            }
        });
        console.log(`   ✅ Store Created: ${store.id}`);

        // 2. Create a Product
        const productName = `Direct DB Product ${Date.now()}`;
        console.log(`2. Creating Product: "${productName}"...`);

        const product = await prisma.product.create({
            data: {
                storeId: store.id,
                name: productName,
                description: 'Created directly via Prisma Client',
                // variants...
                variants: {
                    create: [
                        {
                            name: 'Standard Edition',
                            price: 19.99,
                            sku: `SKU-${Date.now()}`,
                            condition: 'NEAR_MINT',
                            isFoil: false,
                            inventory: {
                                create: {
                                    storeId: store.id,
                                    quantity: 100
                                }
                            }
                        }
                    ]
                }
            },
            include: { variants: true }
        });

        console.log(`   ✅ Product Created: ${product.id}`);
        console.log(`   ✅ Variant Created: ${product.variants[0].id}`);

        // 3. Verify Read
        console.log('3. Verifying Read...');
        const fetchedProduct = await prisma.product.findUnique({
            where: { id: product.id },
            include: { variants: { include: { inventory: true } } }
        });

        if (fetchedProduct && fetchedProduct.variants[0].inventory.quantity === 100) {
            console.log('   ✅ Read Verification Successful: Inventory is 100.');
        } else {
            console.error('   ❌ Read Verification Failed!');
        }

    } catch (error) {
        console.error('❌ Database Verification Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
