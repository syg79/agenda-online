import { prisma } from '@/lib/prisma';
import { calculateEndTime, timeToMinutes } from '@/lib/utils';
import { getValidPhotographers } from '@/lib/scheduling-rules';
import { checkSlotViability } from './smart-scheduling';

type TimeSlot = {
    time: string;
    endTime: string;
    available: number;
};

export async function getAvailability(
    date: Date,
    serviceIds: string[],
    neighborhood?: string,
    lat?: number,
    lng?: number,
    isAdmin: boolean = false
): Promise<TimeSlot[]> {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getUTCDay(); // 0=Sun, 6=Sat

    // 1. Basic Validations
    if (dayOfWeek === 0) return []; // Sunday Closed

    // 2. Determine Duration and Slots Needed
    const totalDurationRaw = serviceIds.reduce((acc, id) => {
        const durationMap: Record<string, number> = {
            'photo': 40,
            'video_landscape': 20,
            'video_portrait': 20,
            'drone_photo': 25,
            'drone_photo_video': 40
        };
        return acc + (durationMap[id] || 30);
    }, 0);

    // Apply Logic: 
    // 1. Add Buffer (Travel/Setup) = 10 mins
    // 2. Round UP to nearest 30 mins to consume full slots
    const BUFFER_MINUTES = 10;
    const durationWithBuffer = totalDurationRaw + BUFFER_MINUTES;
    const slotsNeeded = Math.ceil(durationWithBuffer / 30);
    const totalDuration = slotsNeeded * 30;

    // 3. Filter Photographers by Capability and Location (Rules Engine)
    const qualifiedPhotographers = await getValidPhotographers(neighborhood || '', serviceIds, lat, lng);

    console.log(`[Availability] Qualifed Photographers for ${neighborhood}:`, qualifiedPhotographers.map(p => p.name));

    if (qualifiedPhotographers.length === 0) return [];

    const qualifiedIds = qualifiedPhotographers.map(p => p.id);

    // 4. Fetch Existing Bookings and Blocks
    // We fetch bookings for our qualified photographers OR unassigned bookings (null)
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

    const blocks = await prisma.timeBlock.findMany({
        where: {
            date: {
                gte: new Date(`${dateStr}T00:00:00.000Z`),
                lte: new Date(`${dateStr}T23:59:59.999Z`),
            },
            photographerId: { in: qualifiedIds }
        }
    });

    // 5. Generate Slots
    // Requirements: 08:00, 09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00
    const desiredHours = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18];
    const slots: TimeSlot[] = [];

    for (const hour of desiredHours) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;

        // Calculate end time of this POTENTIAL booking
        const startMinutes = hour * 60;
        const endMinutes = startMinutes + totalDuration;
        const endH = Math.floor(endMinutes / 60);
        const endM = endMinutes % 60;
        const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

        // Check if finishes after closing time (19:00 = 19 * 60 = 1140)
        if (endMinutes > 19 * 60) continue;

        // 6. Calculate Available Capacity
        // Start with photographers who have no assigned conflicts
        const freePhotographers = qualifiedPhotographers.filter(ph => {
            // Check Assigned Bookings
            const phBookings = bookings.filter(b => b.photographerId === ph.id);
            const hasBookingConflict = phBookings.some(b => {
                const bStart = timeToMinutes(b.time);
                const bEnd = bStart + b.duration;
                return (startMinutes < bEnd) && (endMinutes > bStart);
            });
            if (hasBookingConflict) return false;

            // Check Blocks
            const phBlocks = blocks.filter(b => b.photographerId === ph.id);
            const hasBlockConflict = phBlocks.some(b => {
                const bStart = timeToMinutes(b.startTime);
                const bEnd = timeToMinutes(b.endTime);
                return (startMinutes < bEnd) && (endMinutes > bStart);
            });
            if (hasBlockConflict) return false;

            return true;
        });

        // Smart Scheduling check for each remaining free photographer
        let availableCount = 0;
        for (const ph of freePhotographers) {
            if (lat && lng) {
                const phBookings = bookings.filter(b => b.photographerId === ph.id);
                const viability = await checkSlotViability(
                    startMinutes,
                    endMinutes,
                    lat,
                    lng,
                    phBookings
                );
                if (viability === 'IMPOSSIBLE') continue;
            }
            availableCount++;
        }

        // Subtract Unassigned Bookings from the capacity pool ONLY FOR CLIENTS
        // Secretaries (isAdmin) can see full capacity to manually assign/override
        let unassignedConflictsCount = 0;
        if (!isAdmin) {
            const unassignedBookings = bookings.filter(b => b.photographerId === null);
            const unassignedConflicts = unassignedBookings.filter(b => {
                const bStart = timeToMinutes(b.time);
                const bEnd = bStart + b.duration;
                return (startMinutes < bEnd) && (endMinutes > bStart);
            });
            unassignedConflictsCount = unassignedConflicts.length;
        }

        const finalCount = Math.max(0, availableCount - unassignedConflictsCount);

        console.log(`[Availability] Slot ${timeStr}: Qualified=${availableCount}, UnassignedConflicts=${unassignedConflictsCount}, Final=${finalCount}, isAdmin=${isAdmin}`);

        if (finalCount > 0) {
            slots.push({
                time: timeStr,
                endTime: endTimeStr,
                available: finalCount
            });
        }
    }

    return slots;
}
