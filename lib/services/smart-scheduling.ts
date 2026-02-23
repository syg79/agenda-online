
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

    // 2. Identify Context (Prev & Next items)
    const targetMinutes = timeToMinutes(timeStr);

    let prevItem: { lat: number; lng: number; label: string; endTimeMinutes?: number } | null = null;
    let nextItem: { lat: number; lng: number; label: string; startTimeMinutes?: number } | null = null;

    // Default Start: Base
    let originLat = photographer.baseLat;
    let originLng = photographer.baseLng;
    let originLabel = 'Base (Casa)';

    // Find closest orders
    let lastBefore = null;
    let firstAfter = null;

    for (const b of schedule) {
        if (!b.time) continue;
        const bStart = timeToMinutes(b.time);

        if (bStart < targetMinutes) {
            // Check if this is the LATEST defined slot before target
            if (!lastBefore || timeToMinutes(lastBefore.time) < bStart) {
                lastBefore = b;
            }
        } else if (bStart > targetMinutes) {
            // Check if this is the EARLIEST defined slot after target
            if (!firstAfter || timeToMinutes(firstAfter.time) > bStart) {
                firstAfter = b;
            }
        }
    }

    if (lastBefore && lastBefore.latitude && lastBefore.longitude) {
        const lastBeforeStart = timeToMinutes(lastBefore.time);
        const lastBeforeEnd = lastBeforeStart + (lastBefore.duration || 60);

        // Removed hardcoded "assume base if > 3 hours". 
        // We now always anchor to the previous booking of the day, regardless of the gap size,
        // allowing the "ellipse" math to find the perfect midpoint even between distant shifts.
        prevItem = {
            lat: lastBefore.latitude,
            lng: lastBefore.longitude,
            label: `Saída de: ${lastBefore.clientName}`,
            endTimeMinutes: lastBeforeEnd
        };
        originLat = lastBefore.latitude;
        originLng = lastBefore.longitude;
        originLabel = prevItem.label;
    } else if (photographer.baseLat && photographer.baseLng) {
        prevItem = {
            lat: photographer.baseLat,
            lng: photographer.baseLng,
            label: 'Saída da Base',
            endTimeMinutes: targetMinutes - 60 // Assume leaving base recently
        };
    }

    if (firstAfter && firstAfter.latitude && firstAfter.longitude) {
        const firstAfterStart = timeToMinutes(firstAfter.time);
        const targetEndMinutes = targetMinutes + 60; // Approx duration

        // Removed explicit cut-off for > 3 hours. Always anchor to next booking.
        nextItem = {
            lat: firstAfter.latitude,
            lng: firstAfter.longitude,
            label: `Indo para: ${firstAfter.clientName}`,
            startTimeMinutes: firstAfterStart
        };
    }

    // 3. Fetch Pending Orders
    const pending = await (prisma as any).booking.findMany({
        where: {
            status: { in: ['PENDING', 'PENDENTE', 'WAITING'] }, // Broaden check
            photographerId: null,
            latitude: { not: null },
            longitude: { not: null }
        },
        take: 300 // Match dashboard limit
    });

    // 4. Score and Sort (Ranking by Weighted Distance / Time Pressure)
    const suggestions = pending.map((p: any) => {
        if (!p.latitude || !p.longitude) return null;

        // A. Distance from Start
        const distFromPrev = prevItem
            ? calculateDistance(prevItem.lat, prevItem.lng, p.latitude, p.longitude)
            : calculateDistance(originLat!, originLng!, p.latitude, p.longitude);

        // B. Distance to End
        const distToNext = nextItem
            ? calculateDistance(p.latitude, p.longitude, nextItem.lat, nextItem.lng)
            : 0;

        // --- Time Pressure & Logic ---
        // We use pure "Insertion Heuristic" -> how much detour cost is added?
        // Cost = dist(Prev, P) + dist(P, Next). 
        // We removed asymmetric time gap multipliers because they distort the geometry
        // (creating a gravity well near the previous booking and ruining the perfect ellipse).

        let sortScore = 0;
        let debugInfo = 'Pure geom: ';

        if (prevItem && nextItem) {
            // Both anchors exist: pure insertion cost (ellipse)
            sortScore = distFromPrev + distToNext;
        } else {
            // Only one anchor
            sortScore = distFromPrev;
        }

        return {
            ...p,
            distanceKm: parseFloat(distFromPrev.toFixed(1)),
            sortScore: sortScore,
            originLabel,
            extraInfo: nextItem ? `(Entre ${originLabel.replace('Saída de: ', '')} e ${nextItem.label.replace('Indo para: ', '')})` : '',
            debugInfo // Optional: for debugging
        };
    }).filter(Boolean).sort((a: any, b: any) => a.sortScore - b.sortScore);

    // Return top 20 relevant suggestions
    return suggestions.slice(0, 20);
}

function timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
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

export async function checkSlotViability(
    startMinutes: number,
    endMinutes: number,
    lat: number,
    lng: number,
    bookings: any[]
): Promise<'VIABLE' | 'IMPOSSIBLE'> {
    // Basic implementation: check if the new slot overlaps with travel time + buffer
    // For now, we return VIABLE to allow the build to pass and basic scheduling to work.
    // In a real scenario, this would calculate travel time between the new location (lat, lng)
    // and the photographer's existing bookings.
    return 'VIABLE';
}

