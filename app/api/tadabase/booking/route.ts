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
        console.log(`🔎 Searching Tadabase for protocol: ${protocol}`);
        const bookingData = await tadabase.getFormattedBooking(protocol);
        console.log('📦 Found booking data:', bookingData);

        if (!bookingData) {
            console.log('⚠️ Booking not found for protocol:', protocol);
            // Return visible JSON for debugging
            return NextResponse.json({
                error: 'Booking not found',
                protocol,
                message: 'No record matched this protocol in Tadabase.'
            }, { status: 404 });
        }

        return NextResponse.json(bookingData);
    } catch (error) {
        console.error('Error fetching Tadabase booking:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
