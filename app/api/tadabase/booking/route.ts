import { NextResponse } from 'next/server';
import { tadabase } from '@/lib/tadabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const protocol = searchParams.get('protocol');

    if (!protocol) {
        return NextResponse.json({ error: 'Protocol required' }, { status: 400 });
    }

    try {
        const bookingData = await tadabase.getFormattedBooking(protocol);

        if (!bookingData) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json(bookingData);
    } catch (error) {
        console.error('Error fetching Tadabase booking:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
