
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pending = await prisma.booking.findMany({
        where: {
            photographerId: null,
            status: { not: 'CANCELED' }
        },
        select: {
            id: true,
            clientName: true,
            latitude: true,
            longitude: true,
            address: true
        }
    });

    console.log(`Found ${pending.length} pending items.`);
    const withCoords = pending.filter(p => p.latitude && p.longitude);
    console.log(`${withCoords.length} have coordinates.`);

    if (pending.length > 0 && withCoords.length === 0) {
        console.log('WARNING: Pending items exist but NONE have coordinates. Map will be empty.');
        console.log('Sample:', pending[0]);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
