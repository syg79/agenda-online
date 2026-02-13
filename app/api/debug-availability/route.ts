import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAvailability } from '@/lib/services/availabilityService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const servicesStr = searchParams.get('services');

    if (!dateStr || !servicesStr) {
        return NextResponse.json({ error: 'Date and services are required' }, { status: 400 });
    }

    const log: any[] = [];
    const addLog = (msg: string, data?: any) => log.push({ msg, data, time: new Date().toISOString() });

    try {
        addLog('1. Starting Logic Check', { dateStr, servicesStr });

        const services = servicesStr.split(',');
        const date = new Date(dateStr);

        // Check Bookings Data First (Raw)
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        const rawBookings = await prisma.booking.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELED' }
            },
            select: { id: true, time: true, duration: true, photographerId: true }
        });

        addLog('2. Raw Bookings Found', rawBookings);

        // Validate Times
        rawBookings.forEach(b => {
            if (!b.time || typeof b.time !== 'string' || !b.time.includes(':')) {
                addLog('⚠️ CRITICAL: Invalid Token Found', b);
            }
        });

        addLog('3. Calling getAvailability()');
        const slots = await getAvailability(date, services);

        addLog('4. Success', { slotsCount: slots.length });

        return NextResponse.json({
            success: true,
            log,
            slots
        });

    } catch (error: any) {
        addLog('CRITICAL ERROR', error.message);
        console.error('Debug Logic Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            log
        }, { status: 500 });
    }
}
