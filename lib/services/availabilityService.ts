import { prisma } from '@/lib/prisma';
import { calculateEndTime, timeToMinutes, getServicesRequiringDrone, getServicesRequiringVideo } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

type TimeSlot = {
    time: string;
    endTime: string;
    available: number;
};

export async function getAvailability(date: Date, serviceIds: string[]): Promise<TimeSlot[]> {
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

    // 3. Filter Photographers by Capability
    const needsDrone = serviceIds.some(id => id.includes('drone'));
    const needsVideo = serviceIds.some(id => id.includes('video'));

    // Fetch active photographers
    const allPhotographers = await prisma.photographer.findMany({
        where: { active: true }
    });

    // Filter based on static capabilities (approximated for MVP)
    // In a real app, capabilities would be in the DB.
    // For MVP: 
    // - Rafael: Photo, Video, Drone
    // - Augusto: Photo, Video
    // - Renato: Photo
    // - Rodrigo: Photo

    const qualifiedPhotographers = allPhotographers.filter(p => {
        // For MVP: If services is not defined or empty, assume FULL capability to prevent blocking
        const services = (p as any).services;

        if (!services || (Array.isArray(services) && services.length === 0)) {
            return true;
        }

        const pServices = (Array.isArray(services) ? services : []) as string[];

        // Strict check only if services are explicitly defined
        if (needsDrone && !pServices.includes('drone')) return false;
        if (needsVideo && !pServices.some(s => s.includes('video'))) return false;

        return true;
    });

    if (qualifiedPhotographers.length === 0) return [];

    const qualifiedIds = qualifiedPhotographers.map(p => p.id);

    // 4. Fetch Existing Bookings and Blocks
    const bookings = await prisma.booking.findMany({
        where: {
            date: {
                gte: new Date(`${dateStr}T00:00:00.000Z`),
                lte: new Date(`${dateStr}T23:59:59.999Z`),
            },
            status: { not: 'CANCELED' },
            photographerId: { in: qualifiedIds }
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
        const h = hour;
        const m = '00';
        const timeStr = `${h.toString().padStart(2, '0')}:${m}`;

        // Calculate end time of this POTENTIAL booking
        const startMinutes = hour * 60;
        const endMinutes = startMinutes + totalDuration;
        const endH = Math.floor(endMinutes / 60);
        const endM = endMinutes % 60;
        const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

        // Check if finishes after closing time (19:00 = 19 * 60 = 1140)
        if (endMinutes > 19 * 60) continue;

        // 6. Check Availability for each photographer
        let availableCount = 0;

        for (const ph of qualifiedPhotographers) {
            // Check Bookings
            const phBookings = bookings.filter(b => b.photographerId === ph.id);
            const hasBookingConflict = phBookings.some(b => {
                const bStart = timeToMinutes(b.time);
                const bEnd = bStart + b.duration;
                // Conflict if intervals overlap
                // (StartA < EndB) && (EndA > StartB)
                return (startMinutes < bEnd) && (endMinutes > bStart);
            });

            if (hasBookingConflict) continue;

            // Check Blocks
            const phBlocks = blocks.filter(b => b.photographerId === ph.id);
            const hasBlockConflict = phBlocks.some(b => {
                const bStart = timeToMinutes(b.startTime);
                const bEnd = timeToMinutes(b.endTime);
                return (startMinutes < bEnd) && (endMinutes > bStart);
            });

            if (hasBlockConflict) continue;

            availableCount++;
        }

        if (availableCount > 0) {
            slots.push({
                time: timeStr,
                endTime: endTimeStr,
                available: availableCount
            });
        }
    }

    return slots;
}
