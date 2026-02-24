// Force redeploy v1
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tadabase } from '@/lib/tadabase';

export async function POST(req: NextRequest) {
    try {
        const { bookingId, photographerId, date, time, clientName, clientPhone, clientEmail, notes, services } = await req.json();

        if (!bookingId || !photographerId || !date || !time) {
            return NextResponse.json(
                { error: 'Dados incompletos (ID, Fotógrafo, Data e Hora são obrigatórios).' },
                { status: 400 }
            );
        }

        // 1. Check if slot is taken
        const targetDate = new Date(date + 'T00:00:00');

        const collision = await (prisma as any).booking.findFirst({
            where: {
                photographerId,
                date: targetDate, // Prisma handles Date objects for DateTime fields
                time,
                status: { not: 'CANCELED' }, // Ignore canceled
            },
        });

        if (collision && collision.id !== bookingId) {
            return NextResponse.json(
                { error: 'Já existe um agendamento para este fotógrafo neste horário.' },
                { status: 409 }
            );
        }

        // 2. Update Booking (LOCAL DB)
        const updated = await (prisma as any).booking.update({
            where: { id: bookingId },
            data: {
                photographerId,
                date: targetDate,
                time,
                status: 'CONFIRMED',
                updatedAt: new Date(),
                // Optional fields
                ...(clientName && { clientName }),
                ...(clientPhone && { clientPhone }),
                ...(clientEmail && { clientEmail }),
                ...(notes && { notes }),
                ...(services && { services }),
            },
            include: {
                photographer: true,
            },
        });

        // 3. Sync with Tadabase (Hybrid Sandbox)
        const SANDBOX_MODE = true; // TOGGLE THIS FOR PRODUCTION

        if (!SANDBOX_MODE) {
            try {
                await tadabase.syncBooking(updated);
            } catch (syncError) {
                console.error('Falha ao sincronizar com Tadabase:', syncError);
                // We don't fail the request if sync fails, just log it
            }
        } else {
            console.log(`[SANDBOX] Agendamento ${bookingId} salvo localmente. Sync ignorado.`);
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
