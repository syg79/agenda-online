
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const bookings = await prisma.booking.findMany({
        where: {
            status: { not: 'CANCELED' }
        },
        select: {
            id: true,
            clientName: true,
            address: true,
            latitude: true,
            longitude: true,
            status: true
        }
    });

    console.log(`Total Bookings: ${bookings.length}`);
    const missing = bookings.filter(b => b.latitude === null || b.longitude === null);
    console.log(`Missing Coords: ${missing.length}`);

    if (missing.length > 0) {
        console.log("Sample missing coords:");
        missing.slice(0, 5).forEach(b => console.log(`${b.clientName} (${b.status}): ${b.address.substring(0, 30)}`));
    }
}

check()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
