
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tadabase } from '@/lib/tadabase';

export async function POST(req: NextRequest) {
    try {
        const { bookingId, photographerId, date, time } = await req.json();

        if (!bookingId || !photographerId || !date || !time) {
            return NextResponse.json(
                { error: 'Dados incompletos (ID, Fotógrafo, Data e Hora são obrigatórios).' },
                { status: 400 }
            );
        }

        // 1. Check if slot is taken? 
        const targetDate = new Date(date + 'T00:00:00');

        const collision = await (prisma as any).booking.findFirst({
            where: {
                photographerId,
                date: targetDate,
                time,
                status: { not: 'CANCELED' },
            },
        });

        if (collision && collision.id !== bookingId) {
            return NextResponse.json(
                { error: 'Já existe um agendamento para este fotógrafo neste horário.' },
                { status: 409 }
            );
        }

        // 2. Update Booking
        const updated = await (prisma as any).booking.update({
            where: { id: bookingId },
            data: {
                photographerId,
                date: targetDate,
                time,
                status: 'CONFIRMED',
                updatedAt: new Date(),
            },
            include: {
                photographer: true,
            },
        });

        // 3. Sync with Tadabase
        try {
            await tadabase.syncBooking(updated);
        } catch (syncError) {
            console.error('Falha ao sincronizar com Tadabase:', syncError);
            // Don't fail the request, just log it.
        }

        return NextResponse.json({
            success: true,
            booking: updated,
        });

    } catch (error: any) {
        console.error('Erro ao atribuir agendamento:', error);
        return NextResponse.json(
            { error: 'Falha interna ao processar agendamento.' },
            { status: 500 }
        );
    }
}
