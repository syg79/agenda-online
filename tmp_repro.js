
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

async function test() {
    console.log("--- Starting Availability Debug ---");
    const dateStr = '2026-03-07';
    const qIds = [];

    const augusto = await prisma.photographer.findFirst({ where: { name: { contains: 'Augusto' } } });
    if (augusto) {
        qIds.push(augusto.id);
        console.log("Qualified Photographer:", augusto.name, augusto.id);
    }

    const bookings = await prisma.booking.findMany({
        where: {
            date: {
                gte: new Date(`${dateStr}T00:00:00.000Z`),
                lte: new Date(`${dateStr}T23:59:59.999Z`),
            },
            status: { not: 'CANCELED' },
            OR: [
                { photographerId: { in: qIds } },
                { photographerId: null }
            ]
        }
    });

    console.log(`Found ${bookings.length} bookings for date ${dateStr}`);
    bookings.forEach(b => console.log(`- Booking ${b.protocol}: ${b.time} (${b.duration}m), Neighborhood: ${b.neighborhood}, Photographer: ${b.photographerId}`));

    const hour = 18;
    const startMinutes = hour * 60;
    const totalDuration = 60;
    const endMinutes = startMinutes + totalDuration;

    console.log(`Checking slot 18:00 (Mins: ${startMinutes} to ${endMinutes})`);

    let availableCount = 0;
    if (augusto) {
        const phBookings = bookings.filter(b => b.photographerId === augusto.id);
        const hasBookingConflict = phBookings.some(b => {
            const bStart = timeToMinutes(b.time);
            const bEnd = bStart + b.duration;
            return (startMinutes < bEnd) && (endMinutes > bStart);
        });
        if (!hasBookingConflict) availableCount++;
    }

    console.log(`Count after assigned: ${availableCount}`);

    const unassignedBookings = bookings.filter(b => b.photographerId === null);
    const unassignedConflicts = unassignedBookings.filter(b => {
        const bStart = timeToMinutes(b.time);
        const bEnd = bStart + b.duration;
        const overlaps = (startMinutes < bEnd) && (endMinutes > bStart);
        return overlaps;
    });

    console.log(`Unassigned conflicts found: ${unassignedConflicts.length}`);
    availableCount = Math.max(0, availableCount - unassignedConflicts.length);
    console.log(`Final Available Count: ${availableCount}`);

    process.exit();
}

test();
