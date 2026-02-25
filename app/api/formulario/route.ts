import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            ref,
            clientName,
            clientEmail,
            clientPhone,
            services,
            notes,
            address,
            neighborhood,
            city,
            zipCode,
            propertyType,
            complement,
            latitude,
            longitude,
            brokerDetails
        } = body;

        if (!clientName || !clientEmail || !clientPhone) {
            return NextResponse.json({
                success: false,
                error: 'Nome, email e telefone são obrigatórios'
            }, { status: 400 });
        }

        // Generate protocol: FRM-YYYYMMDD-HHMMSS
        const now = new Date();
        const protocol = `FRM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        const booking = await prisma.booking.create({
            data: {
                protocol,
                status: 'PENDING',
                clientName,
                clientEmail,
                clientPhone,
                address: address || 'Endereço não informado',
                neighborhood: neighborhood || 'Bairro conforme contrato',
                city: city || 'Curitiba',
                state: 'PR',
                zipCode: zipCode || null,
                complement: complement || null,
                propertyType: propertyType || null,
                brokerDetails: brokerDetails || null,
                services: Array.isArray(services) ? services : ['photo'],
                notes: notes ? `[REF: ${ref || 'N/A'}] ${notes}` : ref ? `[REF: ${ref}]` : null,
                date: now,
                time: '08:00',
                duration: 60,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            }
        });

        await prisma.syncLog.create({
            data: {
                source: 'formulario',
                status: 'success',
                imported: 1,
                details: { protocol, ref: ref || null }
            }
        });

        return NextResponse.json({
            success: true,
            protocol: booking.protocol,
            bookingId: booking.id
        });

    } catch (error: any) {
        console.error('[Formulario] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Erro ao criar pedido'
        }, { status: 500 });
    }
}
