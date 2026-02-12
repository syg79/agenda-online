import { NextResponse } from 'next/server';
import { getAvailability } from '@/lib/services/availabilityService';

export const dynamic = 'force-dynamic'; // Ensure no caching for availability

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const servicesStr = searchParams.get('services');

    if (!dateStr || !servicesStr) {
        return NextResponse.json({ error: 'Date and services are required' }, { status: 400 });
    }

    try {
        const services = servicesStr.split(',');
        const date = new Date(dateStr);

        // Correct for timezone if needed, or rely on client sending YYYY-MM-DD which JS parses as UTC
        // availabilityService expects a Date object and extracts YYYY-MM-DD

        const slots = await getAvailability(date, services);

        return NextResponse.json({ slots });

    } catch (error) {
        console.error('Error fetching availability:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
