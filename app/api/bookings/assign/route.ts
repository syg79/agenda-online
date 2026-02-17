
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
        // Fluidity: Maybe warn, but for now allow override or simple check.
        // Let's check strict collision (same photographer, exact same time).
        const collision = await prisma.booking.findFirst({
            where: {
                photographerId,
                date: new Date(date), // Be careful with time zone, usually strings work
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
        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                photographerId,
                date: new Date(date),
                time,
                status: 'CONFIRMED', // Ensure it's confirmed
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
