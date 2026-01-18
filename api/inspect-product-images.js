
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    console.log('Inspecting Product Images...');

    // Names from screenshot
    const names = ['Cryparion', 'Death Wind', 'Pikachu', 'Sadidchu', 'Unraveling Mummy', 'Wild Unraveling'];
    const results = [];

    for (const name of names) {
        const products = await prisma.product.findMany({
            where: {
                name: { contains: name, mode: 'insensitive' }
            }
        });

        for (const p of products) {
            results.push({
                name: p.name,
                id: p.id,
                images: p.images,
                game: p.game,
                set: p.set
            });
        }
    }

    fs.writeFileSync('product-dump.json', JSON.stringify(results, null, 2));
    console.log('Dumped to product-dump.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
