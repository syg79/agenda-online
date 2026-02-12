import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const bookings = await prisma.booking.findMany({
        include: { photographer: true }
    });

    console.log('--- ALL BOOKINGS ---');
    bookings.forEach(b => {
        console.log(`ID: ${b.id} | Date: ${b.date.toISOString()} | Time: ${b.time} | Protocol: ${b.protocol}`);
        console.log(`   Client: ${b.clientName} | Services: ${b.services}`);
        console.log(`   Photographer: ${b.photographerId ? b.photographer?.name : 'UNASSIGNED'}`);
        console.log('-----------------------------------');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
