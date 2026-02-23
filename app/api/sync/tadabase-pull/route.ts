import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tadabase, FIELDS } from '@/lib/tadabase';

export async function POST() {
    try {
        console.log('[API] Starting Tadabase Pull for testing...');
        const rawRecords = await tadabase.getVercelTestBookings();

        if (!rawRecords || rawRecords.length === 0) {
            return NextResponse.json({ success: true, message: 'Nenhum registro com "Enviar Vercel=Sim" encontrado.', imported: 0 });
        }

        let imported = 0;
        let errors = 0;
        let skipped = 0;

        for (const record of rawRecords) {
            // Prefer the original protocol (Referência do Cliente) for deduplication during import tests
            const protocol = record[FIELDS.protocolNew] || record[FIELDS.protocol];

            if (!protocol) {
                errors++;
                continue;
            }

            // Check if already in our DB to prevent duplication
            const existing = await prisma.booking.findUnique({
                where: { protocol: protocol as string }
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Get cleaned formatted data
            const formatted = await tadabase.getFormattedBooking(protocol as string);

            if (!formatted) {
                errors++;
                continue;
            }

            // Insert as PENDING in our Database
            await prisma.booking.create({
                data: {
                    protocol: formatted.protocol || `TEMP-${Date.now()}`,
                    clientName: formatted.clientName,
                    clientEmail: formatted.clientEmail,
                    clientPhone: formatted.clientPhone,
                    brokerDetails: formatted.brokerDetails,
                    address: formatted.address || 'Endereço não informado',
                    neighborhood: formatted.neighborhood,
                    city: formatted.city || 'Curitiba',
                    zipCode: formatted.zipCode || '80000-000',
                    complement: formatted.complement,
                    services: formatted.services || [],
                    date: formatted.date ? new Date(formatted.date) : new Date(),
                    time: formatted.time || '08:00',
                    duration: 60,
                    status: 'PENDING',
                    photographerId: null
                }
            });

            imported++;
        }

        console.log(`[API] Tadabase Pull Finished: ${imported} imported, ${skipped} skipped, ${errors} errors.`);

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            errors,
            totalFound: rawRecords.length
        });

    } catch (error: any) {
        console.error('[API] Tadabase Pull Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
