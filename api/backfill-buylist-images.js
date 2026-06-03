const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for BuylistItems...");
  
  const items = await prisma.buylistItem.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { setName: null }
      ]
    }
  });

  console.log(`Found ${items.length} items to update.`);

  let updatedCount = 0;
  for (const item of items) {
    // Try to find the matching product by name
    const product = await prisma.product.findFirst({
      where: {
        name: item.cardName,
        cardId: { not: null }
      }
    });

    if (product) {
      await prisma.buylistItem.update({
        where: { id: item.id },
        data: {
          imageUrl: product.images[0] || null,
          setName: product.set || 'Unknown Set'
        }
      });
      updatedCount++;
    }
  }

  console.log(`Successfully backfilled ${updatedCount} items.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
