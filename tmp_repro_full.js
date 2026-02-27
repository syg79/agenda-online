
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
    const neighborhood = 'Cachoeira';
    const serviceIds = ['photo'];

    const allPhotogs = await prisma.photographer.findMany({ where: { active: true } });

    // Simulating getValidPhotographers
    const qualifiedPhotographers = allPhotogs.filter(p => {
        if (!p.services.includes('photo') && !p.services.includes('ALL')) return false;
        if (!p.neighborhoods) return false;

        const list = p.neighborhoods['photo'];
        if (Array.isArray(list)) {
            return list.some(c => c.trim().toLowerCase() === neighborhood.toLowerCase());
        }
        return false;
    });

    console.log("Qualified Philosophers:", qualifiedPhotographers.map(p => p.name));
    const qualifiedIds = qualifiedPhotographers.map(p => p.id);

    // Fetch Bookings
    const bookings = await prisma.booking.findMany({
        where: {
            date: {
                gte: new Date(`${dateStr}T00:00:00.000Z`),
                lte: new Date(`${dateStr}T23:59:59.999Z`),
            },
            status: { not: 'CANCELED' },
            OR: [
                { photographerId: { in: qualifiedIds } },
                { photographerId: null }
            ]
        }
    });

    console.log(`Found ${bookings.length} relevant bookings`);

    const desiredHours = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18];
    for (const hour of desiredHours) {
        const startMinutes = hour * 60;
        const totalDuration = 60;
        const endMinutes = startMinutes + totalDuration;

        let availableCount = 0;
        for (const ph of qualifiedPhotographers) {
            const phBookings = bookings.filter(b => b.photographerId === ph.id);
            const hasConflict = phBookings.some(b => {
                const bStart = timeToMinutes(b.time);
                const bEnd = bStart + b.duration;
                return (startMinutes < bEnd) && (endMinutes > bStart);
            });
            if (!hasConflict) availableCount++;
        }

        const unassigned = bookings.filter(b => b.photographerId === null);
        const conflicts = unassigned.filter(b => {
            const bStart = timeToMinutes(b.time);
            const bEnd = bStart + b.duration;
            return (startMinutes < bEnd) && (endMinutes > bStart);
        });

        const final = Math.max(0, availableCount - conflicts.length);
        console.log(`${hour}:00 -> Total Qualified: ${availableCount}, Unassigned Conflicts: ${conflicts.length} -> Final: ${final}`);
    }

    process.exit();
}

test();
