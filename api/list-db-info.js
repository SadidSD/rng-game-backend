const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log('Categories:', JSON.stringify(categories, null, 2));

  const games = await prisma.product.findMany({
    select: { game: true },
    distinct: ['game']
  });
  console.log('Games:', JSON.stringify(games, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
