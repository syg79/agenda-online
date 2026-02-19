
import { NextRequest, NextResponse } from 'next/server';
import { findOrdersForSlot } from '@/lib/services/smart-scheduling';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const photographerId = searchParams.get('photographerId');

    if (!date || !time || !photographerId) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    try {
        const suggestions = await findOrdersForSlot(photographerId, date, time);
        return NextResponse.json({ suggestions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
