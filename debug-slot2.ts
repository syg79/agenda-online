import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

function timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

async function debug() {
    // 1. Get Augusto
    const photographer = await prisma.photographer.findFirst({
        where: { name: { contains: 'Augusto' } }
    });

    if (!photographer) {
        console.log("Photographer Augusto not found");
        return;
    }

    const dateStr = '2026-02-23';
    const timeStr = '10:00';

    const startOfDay = new Date(dateStr); startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr); endOfDay.setUTCHours(23, 59, 59, 999);

    const schedule = await prisma.booking.findMany({
        where: {
            photographerId: photographer.id,
            date: { gte: startOfDay, lte: endOfDay },
            status: { not: 'CANCELED' },
            latitude: { not: null },
            longitude: { not: null }
        },
        orderBy: { time: 'asc' }
    });

    console.log("SCHEDULE FOR AUGUSTO:");
    console.table(schedule.map(s => ({ id: s.id, time: s.time, address: s.address, client: s.clientName })));

    let lastBefore = null;
    let firstAfter = null;

    const targetMinutes = timeToMinutes(timeStr);

    for (const b of schedule) {
        if (!b.time) continue;
        const bStart = timeToMinutes(b.time);

        if (bStart < targetMinutes) {
            if (!lastBefore || timeToMinutes(lastBefore.time) < bStart) {
                lastBefore = b;
            }
        } else if (bStart > targetMinutes) {
            if (!firstAfter || timeToMinutes(firstAfter.time) > bStart) {
                firstAfter = b;
            }
        }
    }

    console.log("LAST BEFORE:", lastBefore ? `${lastBefore.time} - ${lastBefore.clientName} (${lastBefore.latitude}, ${lastBefore.longitude})` : 'NULL');
    console.log("FIRST AFTER:", firstAfter ? `${firstAfter.time} - ${firstAfter.clientName} (${firstAfter.latitude}, ${firstAfter.longitude})` : 'NULL');

    let originLat = photographer.baseLat;
    let originLng = photographer.baseLng;
    let originLabel = 'Base (Casa)';
    let prevItem = null;
    let nextItem = null;

    if (lastBefore && lastBefore.latitude && lastBefore.longitude) {
        const lastBeforeStart = timeToMinutes(lastBefore.time);
        const lastBeforeEnd = lastBeforeStart + (lastBefore.duration || 60);

        prevItem = {
            lat: lastBefore.latitude,
            lng: lastBefore.longitude,
            label: `Saída de: ${lastBefore.clientName}`,
            endTimeMinutes: lastBeforeEnd
        };
        originLat = lastBefore.latitude;
        originLng = lastBefore.longitude;
        originLabel = prevItem.label;
    }

    if (firstAfter && firstAfter.latitude && firstAfter.longitude) {
        const firstAfterStart = timeToMinutes(firstAfter.time);
        nextItem = {
            lat: firstAfter.latitude,
            lng: firstAfter.longitude,
            label: `Indo para: ${firstAfter.clientName}`,
            startTimeMinutes: firstAfterStart
        };
    }

    const pending = await prisma.booking.findMany({
        where: {
            status: { in: ['PENDING', 'PENDENTE', 'WAITING'] },
            photographerId: null,
            latitude: { not: null },
            longitude: { not: null }
        },
        take: 300
    });

    console.log(`\nFOUND ${pending.length} PENDING BOOKINGS`);

    let suggestions = pending.map((p: any) => {
        if (!p.latitude || !p.longitude) return null;

        const distFromPrev = prevItem
            ? calculateDistance(prevItem.lat, prevItem.lng, p.latitude, p.longitude)
            : calculateDistance(originLat!, originLng!, p.latitude, p.longitude);

        const distToNext = nextItem
            ? calculateDistance(p.latitude, p.longitude, nextItem.lat, nextItem.lng)
            : 0;

        let weightPrev = 1;
        let weightNext = 1;

        const targetDuration = p.duration || 60;
        const targetEndMinutes = targetMinutes + targetDuration;

        if (prevItem && prevItem.endTimeMinutes !== undefined) {
            const gapPrev = targetMinutes - prevItem.endTimeMinutes;
            if (gapPrev < 45) weightPrev = 3.0;
            if (gapPrev > 120) weightPrev = 0.5;
        }

        if (nextItem && nextItem.startTimeMinutes !== undefined) {
            const gapNext = nextItem.startTimeMinutes - targetEndMinutes;
            if (gapNext < 45) weightNext = 3.0;
            if (gapNext > 120) weightNext = 0.5;
        }

        let sortScore = 0;
        if (prevItem && nextItem) {
            sortScore = (distFromPrev * weightPrev) + (distToNext * weightNext);
        } else {
            sortScore = distFromPrev;
        }

        return {
            id: p.id,
            clientName: p.clientName,
            address: p.address,
            distanceKm: parseFloat(distFromPrev.toFixed(1)),
            sortScore,
            gapPrev: prevItem ? targetMinutes - prevItem.endTimeMinutes : null
        };
    }).filter(Boolean).sort((a: any, b: any) => a.sortScore - b.sortScore);

    console.log("\nTOP 5 SUGGESTIONS:");
    console.table(suggestions.slice(0, 10).map(s => ({ client: s.clientName, address: s.address, dist: s.distanceKm, score: s.sortScore })))
}

debug()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
