
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const photographers = await prisma.photographer.findMany({
        select: { id: true, name: true, active: true }
    });
    console.log('Photographers:', photographers);

    const bookings = await prisma.booking.findMany({
        where: {
            photographerId: { not: null },
            status: { not: 'CANCELED' },
            date: {
                // Check specifically for today or tomorrow to see if any exist
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
            }
        },
        take: 10,
        include: {
            photographer: { select: { name: true } }
        }
    });

    console.log('Sample Bookings (with coords):', bookings.map(b => ({
        id: b.id,
        photographer: b.photographer?.name,
        lat: b.latitude,
        lon: b.longitude
    })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
