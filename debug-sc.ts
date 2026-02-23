import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const p = await prisma.booking.findUnique({ where: { id: '952033' } });
    console.log('LAT/LNG S CANDIDA:', p?.latitude, p?.longitude);
}
run().finally(() => prisma.$disconnect());
