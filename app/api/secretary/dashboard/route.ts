
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date');
        const mode = searchParams.get('mode'); // 'day', 'future', or 'month'

        if (mode === 'month') {
            const yearStr = searchParams.get('year');
            const monthStr = searchParams.get('month');

            if (yearStr && monthStr) {
                const year = parseInt(yearStr);
                const month = parseInt(monthStr) - 1; // 0-indexed

                const startOfMonth = new Date(year, month, 1);
                const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

                const schedule = await (prisma as any).booking.findMany({
                    where: {
                        status: { not: 'CANCELED' },
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    },
                    include: {
                        photographer: {
                            select: { id: true, name: true, color: true }
                        }
                    },
                    orderBy: { date: 'asc' }
                });

                const formattedSchedule = schedule.map((b: any) => ({
                    ...b,
                    date: b.date.toISOString().split('T')[0],
                    time: b.time ? b.time.substring(0, 5) : '',
                    photographerName: b.photographer?.name || 'Indefinido'
                }));

                return NextResponse.json({ schedule: formattedSchedule });
            }
        }

        if (mode === 'future') {
            // Fetch all confirmed bookings from today onwards
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const schedule = await (prisma as any).booking.findMany({
                where: {
                    status: { in: ['CONFIRMED', 'RESERVED', 'RESERVADO'] },
                    date: { gte: today }
                },
                include: {
                    photographer: {
                        select: { id: true, name: true, color: true }
                    }
                },
                orderBy: { date: 'asc' },
                take: 100 // Limit
            });

            // Format similarly
            const formattedSchedule = schedule.map((b: any) => ({
                ...b,
                date: b.date.toISOString().split('T')[0],
                time: b.time ? b.time.substring(0, 5) : '',
                photographerName: b.photographer?.name || 'Indefinido'
            }));

            return NextResponse.json({ schedule: formattedSchedule });
        }

        // Default Day Mode
        const effectiveDateStr = dateStr || new Date().toISOString().split('T')[0];
        const type = searchParams.get('type'); // 'timeline', 'pending', or null (all)
        const includeOverdue = searchParams.get('includeOverdue') === 'true';

        let photographers: any[] = [];
        let schedule: any[] = [];
        let pending: any[] = [];

        // 1. Fetch data based on type
        if (!type || type === 'timeline') {
            photographers = await (prisma as any).photographer.findMany({
                where: { active: true },
                select: {
                    id: true,
                    name: true,
                    color: true,
                    services: true,
                    neighborhoods: true,
                    latitude: true,
                    longitude: true,
                    // New Geolocation Fields
                    baseAddress: true,
                    baseLat: true,
                    baseLng: true,
                    travelRadius: true,
                },
                orderBy: { name: 'asc' },
            });

            // Move 'Fotógrafo Indefinido' or similar to the end
            photographers.sort((a, b) => {
                const isIndefA = a.name.toLowerCase().includes('indefinido');
                const isIndefB = b.name.toLowerCase().includes('indefinido');
                if (isIndefA && !isIndefB) return 1;
                if (!isIndefA && isIndefB) return -1;
                return 0; // Maintain original alphabetical order for others
            });

            const targetDate = new Date(dateStr + 'T00:00:00');
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const scheduleWhere: any = {
                OR: [
                    {
                        date: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    }
                ],
                photographerId: { not: null },
                status: { not: 'CANCELED' },
            };

            if (includeOverdue) {
                scheduleWhere.OR.push({
                    date: { lt: startOfDay },
                    status: 'CONFIRMED' // Still confirmed but in the past
                });
            }

            schedule = await (prisma as any).booking.findMany({
                where: scheduleWhere,
                include: {
                    photographer: {
                        select: { name: true, color: true },
                    },
                },
                orderBy: [
                    { date: 'asc' },
                    { time: 'asc' }
                ],
            });
        }

        if (!type || type === 'pending') {
            pending = await (prisma as any).booking.findMany({
                where: {
                    photographerId: null,
                    status: { not: 'CANCELED' },
                },
                orderBy: [
                    { date: 'asc' },
                    { time: 'asc' },
                ],
                take: 300,
                select: {
                    id: true,
                    protocol: true,
                    clientName: true,
                    date: true,
                    time: true,
                    duration: true,
                    address: true,
                    neighborhood: true,
                    services: true,
                    status: true,
                    latitude: true,
                    longitude: true,
                    // Contact Info
                    clientPhone: true,
                    clientEmail: true,
                    notes: true,
                    brokerDetails: true, // field_177
                }
            });
            console.log(`[API] Found ${pending.length} pending bookings.`);
        }

        const stats = {
            pendingCount: type === 'timeline' ? undefined : pending.length,
            scheduledCount: type === 'pending' ? undefined : schedule.length,
        };

        return NextResponse.json({
            date: dateStr,
            photographers: (!type || type === 'timeline') ? photographers : undefined,
            schedule: (!type || type === 'timeline') ? schedule : [],
            pending: (!type || type === 'pending') ? pending : undefined,
            stats,
        });

    } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
            { error: 'Falha ao carregar dados do painel.', details: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
