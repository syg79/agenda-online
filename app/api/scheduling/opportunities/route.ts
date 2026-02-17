
import { NextRequest, NextResponse } from 'next/server';
import { findSchedulingOpportunities } from '@/lib/services/smart-scheduling';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const latStr = searchParams.get('lat');
        const lngStr = searchParams.get('lng');
        const dateStr = searchParams.get('date');

        if (!latStr || !lngStr) {
            return NextResponse.json(
                { error: 'Latitude e Longitude são obrigatórios.' },
                { status: 400 }
            );
        }

        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        const date = dateStr || new Date().toISOString().split('T')[0];

        const opportunities = await findSchedulingOpportunities(lat, lng, date);

        return NextResponse.json({
            count: opportunities.length,
            opportunities
        });

    } catch (error: any) {
        console.error('Smart Scheduling Error:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar oportunidades.' },
            { status: 500 }
        );
    }
}
