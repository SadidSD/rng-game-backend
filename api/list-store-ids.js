const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const storeIds = await prisma.product.findMany({
    select: { storeId: true },
    distinct: ['storeId']
  });
  console.log(JSON.stringify(storeIds, null, 2));

  const stores = await prisma.store.findMany();
  console.log('Stores in DB:', JSON.stringify(stores, null, 2));
}
main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
