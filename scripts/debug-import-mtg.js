
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing MTG Product Creation with Images...');

    const storeId = 'd02dbcba-81b5-4f9d-831c-54fe9a803081'; // Dev Store ID

    const mockMtgProduct = {
        name: 'Black Lotus (Debug)',
        description: 'Debug Import Test',
        game: 'MTG',
        categoryId: null, // Skipping category validation for raw test if possible, or fetch one
        set: 'Alpha',
        rarity: 'Rare',
        collectorNumber: '001',
        price: 99999.00,
        images: ['https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg'],
        slug: 'black-lotus-debug-' + Date.now(),
        storeId: storeId
    };

    try {
        console.log('Creating product:', mockMtgProduct.name);
        const product = await prisma.product.create({
            data: {
                ...mockMtgProduct,
                variants: {
                    create: [{
                        condition: 'NM',
                        price: 99999.00,
                        storeId: storeId,
                        inventory: { create: { quantity: 1, storeId: storeId } }
                    }]
                }
            }
        });
        console.log('Product created successfully!');
        console.log('ID:', product.id);
        console.log('Images:', product.images);

        if (product.images && product.images.length > 0) {
            console.log('PASS: Image URL saved correctly.');
        } else {
            console.error('FAIL: Image array is empty!');
        }

    } catch (error) {
        console.error('Error creating product:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
