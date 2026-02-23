import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const p = await prisma.photographer.findFirst({ where: { name: { contains: 'Augusto' } } });
    console.log('BASE AUGUSTO:', p?.baseAddress, p?.baseLat, p?.baseLng);
}
run().finally(() => prisma.$disconnect());
