
import { prisma } from '@/lib/prisma';

// Helper for Haversine Distance (Simple, no API cost)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

// --- Types ---

export interface SchedulingOpportunity {
    type: 'GAP_BEFORE' | 'GAP_AFTER' | 'NEARBY_PENDING';
    photographer: {
        id: string;
        name: string;
        color: string;
    };
    referenceBooking: {
        id: string; // or 'PENDING'
        time: string;
        address: string;
        neighborhood: string;
    };
    distanceKm: number;
    travelTimeMin: number;
    suggestedTime: string; // "14:30"
    score: number; // Higher is better
}

// --- Constants ---

const MAX_SEARCH_RADIUS_KM = 15;
const SAFETY_BUFFER_MIN = 30; // 30 mins buffer between jobs (setup + parking)
const DEFAULT_DURATION_MIN = 60; // Standard photo session

// --- Service ---

export async function findSchedulingOpportunities(
    lat: number,
    lng: number,
    dateStr: string, // YYYY-MM-DD
    durationMin: number = DEFAULT_DURATION_MIN
): Promise<SchedulingOpportunity[]> {
    const opportunities: SchedulingOpportunity[] = [];

    // 1. Fetch all confirmed bookings for the day
    // We need to see where photographers ALREADY are.
    const startOfDay = new Date(dateStr); startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr); endOfDay.setUTCHours(23, 59, 59, 999);

    const bookings = await (prisma as any).booking.findMany({
        where: {
            date: { gte: startOfDay, lte: endOfDay },
            status: 'CONFIRMED',
            photographerId: { not: null },
            latitude: { not: null },
            longitude: { not: null }
        },
        include: {
            photographer: true
        }
    });

    // 2. Fetch Pending bookings (to cluster unassigned)
    const pending = await (prisma as any).booking.findMany({
        where: {
            status: { not: 'CANCELED' },
            photographerId: null,
            latitude: { not: null },
            longitude: { not: null },
            // Removed date filter: Pending orders are relevant regardless of requested date if they are geographically close
        },
        take: 100 // Safety limit
    });

    // 3. Process Confirmed Bookings (Find Gaps)
    for (const b of bookings) {
        // Safe check for nulls
        if (b.latitude === null || b.longitude === null || !b.photographer) continue;

        const dist = calculateDistance(lat, lng, b.latitude, b.longitude);

        if (dist <= MAX_SEARCH_RADIUS_KM) {
            // It's close! Let's check travel time.
            const travelTime = Math.ceil((dist * 2)); // Conservative: 2 min per km (City Traffic)

            // A. Gap AFTER
            // Existing: 10:00 (60m) -> Ends 11:00
            // Travel: 20m
            // Buffer: 15m
            // Start: 11:35 -> Round to 11:30 or 12:00?
            const existingStart = parseTime(b.time);
            const existingEnd = addMinutes(existingStart, b.duration);

            const startAfter = addMinutes(existingEnd, travelTime + 15); // 15m minimal gap

            opportunities.push({
                type: 'GAP_AFTER',
                photographer: {
                    id: b.photographer.id,
                    name: b.photographer.name,
                    color: b.photographer.color
                },
                referenceBooking: {
                    id: b.id,
                    time: b.time,
                    address: b.address.split(',')[0], // Shorten address
                    neighborhood: b.neighborhood
                },
                distanceKm: parseFloat(dist.toFixed(1)),
                travelTimeMin: travelTime,
                suggestedTime: formatTime(startAfter),
                score: (15 - dist) + 5 // Bonus for "After" (Linear flow)
            });

            // B. Gap BEFORE
            const finishBy = subMinutes(existingStart, travelTime + 15);
            const startBefore = subMinutes(finishBy, durationMin);

            const hour = startBefore.getHours();
            if (hour >= 8 && hour < 18) { // Only reasonable hours
                opportunities.push({
                    type: 'GAP_BEFORE',
                    photographer: {
                        id: b.photographer.id,
                        name: b.photographer.name,
                        color: b.photographer.color
                    },
                    referenceBooking: {
                        id: b.id,
                        time: b.time,
                        address: b.address.split(',')[0],
                        neighborhood: b.neighborhood
                    },
                    distanceKm: parseFloat(dist.toFixed(1)),
                    travelTimeMin: travelTime,
                    suggestedTime: formatTime(startBefore),
                    score: (15 - dist) // slightly lower score than "After"
                });
            }
        }
    }

    // 4. Process Pending (Cluster Suggestions)
    for (const p of pending) {
        if (p.latitude === null || p.longitude === null) continue;
        const dist = calculateDistance(lat, lng, p.latitude, p.longitude);

        if (dist <= 5) { // Only suggest clustering if VERY close (<5km)
            opportunities.push({
                type: 'NEARBY_PENDING',
                photographer: { id: 'PENDING', name: 'A Definir', color: '#94a3b8' },
                referenceBooking: {
                    id: p.id,
                    time: '?',
                    address: p.address.split(',')[0],
                    neighborhood: p.neighborhood
                },
                distanceKm: parseFloat(dist.toFixed(1)),
                travelTimeMin: 0,
                suggestedTime: 'Juntar',
                score: (10 - dist) * 0.5 // Lower priority than solid gaps
            });
        }
    }

    // Sort by Distance ASC (Closest first)
    return opportunities.sort((a, b) => a.distanceKm - b.distanceKm);
}

// 5. Find Orders for a specific Slot (Reverse Logic)
export async function findOrdersForSlot(
    photographerId: string,
    dateStr: string,
    timeStr: string
) {
    const startOfDay = new Date(dateStr); startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr); endOfDay.setUTCHours(23, 59, 59, 999);

    // 1. Get Context (Photographer Schedule & Base)
    const photographer = await (prisma as any).photographer.findUnique({
        where: { id: photographerId },
        select: { baseLat: true, baseLng: true, baseAddress: true }
    });

    if (!photographer) throw new Error('Photographer not found');

    const schedule = await (prisma as any).booking.findMany({
        where: {
            photographerId,
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: 'CANCELED' },
            latitude: { not: null },
            longitude: { not: null }
        },
        orderBy: { time: 'asc' }
    });

    // 2. Determine Logistical Reference Point
    // Find the job immediately BEFORE the target time to set the "Start Point"
    // If no job before, use Base.
    let originLat = photographer.baseLat;
    let originLng = photographer.baseLng;
    let originLabel = 'Base (Casa)';

    const targetTimeVal = parseInt(timeStr.replace(':', '')); // e.g., 900, 1430

    let prevBooking = null;
    let nextBooking = null;

    for (const b of schedule) {
        const bTimeVal = parseInt(b.time.replace(':', ''));
        if (bTimeVal < targetTimeVal) {
            prevBooking = b;
        } else if (bTimeVal > targetTimeVal && !nextBooking) {
            nextBooking = b;
        }
    }

    if (prevBooking && prevBooking.latitude && prevBooking.longitude) {
        originLat = prevBooking.latitude;
        originLng = prevBooking.longitude;
        originLabel = `Saída de: ${prevBooking.clientName} (${prevBooking.neighborhood})`;
    }

    if (!originLat || !originLng) return [];

    // 3. Fetch Pending Orders
    const pending = await (prisma as any).booking.findMany({
        where: {
            status: 'PENDING',
            photographerId: null,
            latitude: { not: null },
            longitude: { not: null }
        },
        take: 50
    });

    // 4. Score and Sort
    const suggestions = pending.map((p: any) => {
        if (!p.latitude || !p.longitude) return null;

        const dist = calculateDistance(originLat!, originLng!, p.latitude, p.longitude);

        return {
            ...p,
            distanceKm: parseFloat(dist.toFixed(1)),
            travelTimeMin: Math.ceil(dist * 2), // Rough estimate
            originLabel
        };
    }).filter(Boolean).sort((a: any, b: any) => (a?.distanceKm || 999) - (b?.distanceKm || 999));

    return suggestions;
}

// --- Helpers ---

function parseTime(timeStr: string): Date {
    const d = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
}

function formatTime(d: Date): string {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function addMinutes(d: Date, min: number): Date {
    return new Date(d.getTime() + min * 60000);
}

function subMinutes(d: Date, min: number): Date {
    return new Date(d.getTime() - min * 60000);
}
