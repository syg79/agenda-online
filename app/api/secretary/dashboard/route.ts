
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
        const type = searchParams.get('type'); // 'timeline', 'pending', or null (all)

        let photographers: any[] = [];
        let schedule: any[] = [];
        let pending: any[] = [];

        // 1. Fetch data based on type
        if (!type || type === 'timeline') {
            photographers = await (prisma as any).photographer.findMany({
                where: { active: true },
                select: {
                    id: true,
                    name: true,
                    color: true,
                    services: true,
                    neighborhoods: true,
                    latitude: true,
                    longitude: true,
                },
                orderBy: { name: 'asc' },
            });

            const targetDate = new Date(dateStr + 'T00:00:00');
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            schedule = await (prisma as any).booking.findMany({
                where: {
                    date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    photographerId: { not: null },
                    status: { not: 'CANCELED' },
                },
                include: {
                    photographer: {
                        select: { name: true, color: true },
                    },
                },
                orderBy: { time: 'asc' },
            });
        }

        if (!type || type === 'pending') {
            pending = await (prisma as any).booking.findMany({
                where: {
                    photographerId: null,
                    status: { not: 'CANCELED' },
                },
                orderBy: [
                    { date: 'asc' },
                    { time: 'asc' },
                ],
                take: 50,
                select: {
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
        }

        const stats = {
            pendingCount: type === 'timeline' ? undefined : pending.length,
            scheduledCount: type === 'pending' ? undefined : schedule.length,
        };

        return NextResponse.json({
            date: dateStr,
            photographers: (!type || type === 'timeline') ? photographers : undefined,
            schedule: (!type || type === 'timeline') ? schedule : [],
            pending: (!type || type === 'pending') ? pending : undefined,
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
