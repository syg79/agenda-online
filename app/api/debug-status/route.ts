
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const count = await prisma.booking.count();
        const bookings = await prisma.booking.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            count,
            sample: bookings,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
