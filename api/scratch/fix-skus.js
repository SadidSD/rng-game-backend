const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

function generateSku(game, set, collectorNumber, name, condition, language, isFoil) {
    const gameCode = (game || 'MTG').toUpperCase().substring(0, 3);
    const setCode = (set || 'UNK').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const collector = (collectorNumber || '000').padStart(3, '0').replace(/[^A-Z0-9]/g, '');

    // Slugify Name: UPPERCASE, Remove Spaces/SpecialChars
    const slug = name.toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 25); // Cap length

    const condMap = {
        'NM': 'NM',
        'LP': 'LP',
        'MP': 'MP',
        'HP': 'HP',
        'DAMAGED': 'DMG',
        'SEALED': 'SEALED'
    };
    const condCode = condMap[condition] || condition;

    const langCode = (language || 'English').toUpperCase().substring(0, 2);
    const finishCode = isFoil ? 'F' : 'NF';

    return `${gameCode}-${setCode}-${collector}-${slug}-${condCode}-${langCode}-${finishCode}`;
}

async function main() {
    console.log('--- STARTING SKU FIXES ---');
    const variants = await prisma.productVariant.findMany({
        include: { product: true }
    });

    console.log(`Found ${variants.length} variants in database.`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const variant of variants) {
        const product = variant.product;
        const newSku = generateSku(
            product.game,
            product.set,
            product.collectorNumber,
            product.name,
            variant.condition,
            variant.language,
            variant.isFoil
        );

        if (variant.sku === newSku) {
            console.log(`- SKU already matching for: ${product.name} (${variant.sku})`);
            continue;
        }

        try {
            await prisma.productVariant.update({
                where: { id: variant.id },
                data: { sku: newSku }
            });
            
            // Also update any matching historical order items to clean up existing orders
            const updateRes = await prisma.orderItem.updateMany({
                where: { variantId: variant.id },
                data: { variantSku: newSku }
            });

            console.log(`✓ Updated SKU: ${variant.sku || 'N/A'} → ${newSku} (${product.name}). Synced ${updateRes.count} order items.`);
            fixedCount++;
        } catch (e) {
            console.error(`✗ Failed updating variant ${variant.id} (${product.name}): ${e.message}`);
            errorCount++;
        }
    }

    console.log('--- DIAGNOSTICS COMPLETED ---');
    console.log(`Total variants updated: ${fixedCount}`);
    console.log(`Total errors: ${errorCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
