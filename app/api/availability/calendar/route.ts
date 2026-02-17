
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getValidPhotographers } from '@/lib/scheduling-rules';
import { calculateDistance } from '@/lib/distance';
import { getRouteByCluster, getPreciseRoute } from '@/lib/services/routing';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // YYYY-MM
    const servicesStr = searchParams.get('services');
    const neighborhood = searchParams.get('neighborhood');
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const zipCodeStr = searchParams.get('zipCode'); // Client ZIP (Optional now)

    if (!dateStr || !servicesStr) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    try {
        const [year, month] = dateStr.split('-').map(Number);
        const serviceIds = servicesStr.split(',');
        const clientLat = latStr ? parseFloat(latStr) : undefined;
        const clientLng = lngStr ? parseFloat(lngStr) : undefined;
        const clientZip = zipCodeStr || undefined;

        // 1. Get Valid Photographers (List-Based from Step 2)
        const photographers = await getValidPhotographers(neighborhood || '', serviceIds, clientLat, clientLng);
        const photographerIds = photographers.map(p => p.id);

        if (photographerIds.length === 0) {
            return NextResponse.json({ days: {} });
        }

        // 2. Fetch all bookings for the month
        // We select only needed fields to avoid type errors and reduce payload
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const bookings = await prisma.booking.findMany({
            where: {
                photographerId: { in: photographerIds },
                date: {
                    gte: startDate,
                    lte: endDate
                },
                status: { not: 'CANCELED' }
            },
            select: {
                date: true,
                photographerId: true,
                latitude: true,
                longitude: true,
                zipCode: true,
                neighborhood: true, // Needed for Cluster Matrix
                duration: true
            }
        });

        const blocks = await prisma.timeBlock.findMany({
            where: {
                photographerId: { in: photographerIds },
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // 3. Analyze each day
        const daysStatus: Record<number, string> = {}; // Day -> 'OPEN' | 'FULL' | 'UNVIABLE'
        const startDay = 1;
        const endDay = endDate.getDate();

        for (let d = startDay; d <= endDay; d++) {
            const currentDayDate = new Date(year, month - 1, d);
            const dayOfWeek = currentDayDate.getDay();

            if (dayOfWeek === 0) { // Sunday
                daysStatus[d] = 'CLOSED';
                continue;
            }

            if (currentDayDate < new Date(new Date().setHours(0, 0, 0, 0))) { // Past
                daysStatus[d] = 'CLOSED';
                continue;
            }

            let dayHasOpenSlot = false;

            // Check each photographer
            for (const pId of photographerIds) {
                // Find bookings for this photographer on this day
                const pBookings = bookings.filter(b =>
                    b.photographerId === pId &&
                    b.date.getDate() === d
                );

                // Find blocks for this photographer on this day
                const pBlocks = blocks.filter(b =>
                    b.photographerId === pId &&
                    b.date.getDate() === d
                );

                // A. Capacity Check
                const bookedMinutes = pBookings.reduce((sum, b) => sum + b.duration, 0);
                const blockedMinutes = pBlocks.length * 60; // Approx 60 min per block
                const totalBusy = bookedMinutes + blockedMinutes;

                // Max capacity (7 hours = 420 mins)
                if (totalBusy > 420) {
                    continue; // Photographer Full
                }

                // If no bookings, they are OPEN
                if (pBookings.length === 0) {
                    dayHasOpenSlot = true;
                    break;
                }

                // B. Location Viability
                // Priority: Matrix (Cluster: Neighborhood -> Neighborhood)
                let isViable = true;

                if (pBookings.length > 0) {
                    const MAX_VIABLE_DURATION = 60; // Minutes travel limit
                    const MAX_VIABLE_DISTANCE = 40; // km

                    // Check against ALL bookings of the day
                    for (const b of pBookings) {
                        try {
                            let dist = 0;
                            let dur = 0;

                            // 0. Try Precise Matrix (CEP -> CEP) - The "Learned" Precision
                            if (clientZip && b.zipCode) {
                                const precise = await getPreciseRoute(clientZip, b.zipCode);
                                if (precise) {
                                    dist = precise.distance;
                                    dur = precise.duration;
                                }
                            }

                            // 1. Try Matrix (Neighborhood Cluster -> Neighborhood Cluster)
                            // This covers ALL CEPs because every CEP maps to a neighborhood.
                            if (dist === 0 && neighborhood && b.neighborhood) {
                                const route = await getRouteByCluster(neighborhood, b.neighborhood);
                                dist = route.distance;
                                dur = route.duration;
                            }
                            // 2. Fallback to Haversine (Lat/Lng) if names missing (unlikely)
                            else if (clientLat && clientLng && b.latitude && b.longitude) {
                                dist = calculateDistance(clientLat, clientLng, b.latitude, b.longitude);
                                dur = (dist / 30) * 60 + 10; // Approx
                            } else {
                                continue; // Can't check
                            }

                            if (dur > MAX_VIABLE_DURATION || dist > MAX_VIABLE_DISTANCE) {
                                isViable = false;
                                break; // Found a conflict
                            }
                        } catch (e) {
                            console.error("Matrix Check Failed", e);
                        }
                    }
                }

                if (!isViable) {
                    continue; // Skip this photographer
                }

                // If passed checks, this photographer can take the job
                dayHasOpenSlot = true;
                break; // One available photographer is enough
            }

            daysStatus[d] = dayHasOpenSlot ? 'OPEN' : 'FULL';
        }

        return NextResponse.json({ days: daysStatus });

    } catch (error) {
        console.error('Calendar API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
