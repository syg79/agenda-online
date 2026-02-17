
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming you have a singleton instance

export const dynamic = 'force-dynamic'; // Ensure no caching for status updates

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

        // 1. Fetch Active Photographers
        const photographers = await prisma.photographer.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                color: true,
                services: true,
                neighborhoods: true,
                latitude: true,
                longitude: true,
                // Include preferences or regions if needed later
            },
            orderBy: { name: 'asc' },
        });

        // 2. Fetch Schedule for the Date (Confirmed/Completed/In_Progress)
        // We need to parse the date to query the DateTime field correctly
        // Assuming 'date' in DB is stored as midnight UTC or local. 
        // Prisma usually handles exact match if we pass the Date object or string properly.
        // However, if 'date' has time components, we need a range.
        // Let's assume 'date' column is purely date (midnight).

        // Adjust logic: Find bookings where date matches the string YYYY-MM-DD
        const targetDate = new Date(dateStr);

        // Create start and end of day for range query to be safe
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const schedule = await prisma.booking.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                photographerId: { not: null }, // Only assigned bookings
                status: {
                    not: 'CANCELED',
                },
            },
            include: {
                photographer: {
                    select: { name: true, color: true },
                },
            },
            orderBy: { time: 'asc' },
        });

        // 3. Fetch Pending Orders (Unassigned)
        // These are bookings that need a photographer assigned
        const pending = await prisma.booking.findMany({
            where: {
                photographerId: null,
                status: { not: 'CANCELED' },
            },
            orderBy: [
                { date: 'asc' }, // Soonest first
                { time: 'asc' },
            ],
            take: 50,
            select: { // Explicit select to ensure lat/lng is returned
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
                longitude: true
            }
        });

        // 4. Calculate Stats (Optional)
        const stats = {
            pendingCount: pending.length,
            scheduledCount: schedule.length,
        };

        return NextResponse.json({
            date: dateStr,
            photographers,
            schedule,
            pending,
            stats,
        });

    } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
            { error: 'Falha ao carregar dados do painel.' },
            { status: 500 }
        );
    }
}
