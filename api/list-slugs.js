const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({ select: { name: true, slug: true } });
  console.log('Categories slugs:', JSON.stringify(categories, null, 2));

  const games = await prisma.product.findMany({
    select: { game: true },
    distinct: ['game']
  });
  console.log('Unique games field values:', JSON.stringify(games, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
