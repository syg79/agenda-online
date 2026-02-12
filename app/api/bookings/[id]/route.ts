import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tadabase } from '@/lib/tadabase';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();

        // Fields allowed to update
        const {
            date,
            time,
            photographerId,
            address,
            neighborhood,
            status, // e.g. CANCELED
        } = body;

        // Check if booking exists
        const existingBooking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!existingBooking) {
            return NextResponse.json(
                { error: 'Agendamento não encontrado' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData: any = {};
        if (date) updateData.date = new Date(date);
        if (time) updateData.time = time;
        if (photographerId !== undefined) updateData.photographerId = photographerId; // Allow null to unassign?
        if (address) updateData.address = address;
        if (neighborhood) updateData.neighborhood = neighborhood;
        if (status) updateData.status = status;

        // Update in DB
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: updateData,
            include: {
                photographer: true, // Include for sync
            },
        });

        // Sync to Tadabase
        await tadabase.syncBooking(updatedBooking);

        return NextResponse.json({
            success: true,
            booking: updatedBooking,
        });
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        return NextResponse.json(
            { error: 'Falha ao atualizar agendamento' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const existingBooking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!existingBooking) {
            return NextResponse.json(
                { error: 'Agendamento não encontrado' },
                { status: 404 }
            );
        }

        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: { status: 'CANCELED' },
            include: { photographer: true }
        });

        await tadabase.syncBooking(updatedBooking);

        return NextResponse.json({
            success: true,
            message: 'Agendamento cancelado com sucesso',
        });

    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        return NextResponse.json(
            { error: 'Falha ao cancelar agendamento' },
            { status: 500 }
        );
    }
}
