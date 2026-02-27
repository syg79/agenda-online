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

        const neighborhood = searchParams.get('neighborhood');
        const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
        const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;
        const isAdmin = searchParams.get('isAdmin') === 'true';

        // Refined availability logging
        console.log(`[Availability Request] Date: ${dateStr}, Services: ${servicesStr}, Neighborhood: ${neighborhood || 'N/A'}, Lat: ${lat || 'N/A'}, Lng: ${lng || 'N/A'}, isAdmin: ${isAdmin}`);

        const slots = await getAvailability(date, services, neighborhood || undefined, lat, lng, isAdmin);

        console.log(`[Availability Response] Found ${slots.length} slots for Date: ${dateStr}, Services: ${servicesStr}`);

        return NextResponse.json({ slots });

    } catch (error) {
        console.error('❌ Error fetching availability:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
