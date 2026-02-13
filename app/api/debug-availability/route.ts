import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        addLog('Starting debug availability check', { dateStr, servicesStr });

        // 1. Parse Date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid Date format');
        }
        addLog('Date parsed successfully', date.toISOString());

        try {
            const dateCheck = date.toISOString().split('T')[0];
            addLog('Date ISO string check', dateCheck);
        } catch (e: any) {
            throw new Error(`ISO String conversion failed: ${e.message}`);
        }

        // 2. Parse Services
        const serviceIds = servicesStr.split(',');
        addLog('Services parsed', serviceIds);

        // 3. Check Database Connection (Photographers)
        addLog('Fetching photographers...');
        const photographers = await prisma.photographer.findMany({
            where: { active: true }
        });
        addLog(`Found ${photographers.length} active photographers`, photographers.map(p => p.name));

        if (photographers.length === 0) {
            return NextResponse.json({ log, error: 'No active photographers found in DB' });
        }

        // 4. Check Bookings
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

        addLog('Fetching bookings...', { start: startOfDay, end: endOfDay });

        const bookings = await prisma.booking.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: { not: 'CANCELED' }
            }
        });
        addLog(`Found ${bookings.length} bookings for this day`);

        return NextResponse.json({
            success: true,
            log
        });

    } catch (error: any) {
        addLog('CRITICAL ERROR', error.message);
        console.error('Debug Availability Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            log
        }, { status: 500 });
    }
}
