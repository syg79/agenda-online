import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { tadabase, FIELDS } from '@/lib/tadabase';

const prisma = new PrismaClient();

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

        // Fetch local photographers to map by name
        const photographers = await prisma.photographer.findMany({
            select: { id: true, name: true }
        });

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

            // Change: Format the record directly and provide defaults for Prisma
            const formatted = tadabase.formatRecord(record);

            if (!formatted) {
                errors++;
                continue;
            }

            // Mapeamento de Status e Fotógrafo
            let mappedPhotographerId = null;
            let finalStatus = 'PENDING';

            if (formatted.photographerName) {
                const match = photographers.find(p => p.name.toLowerCase() === formatted.photographerName.toLowerCase());
                if (match) {
                    mappedPhotographerId = match.id;
                    finalStatus = 'CONFIRMED';
                    console.log(`[DEBUG] Mapped Tadabase photographer "${formatted.photographerName}" to local ID ${mappedPhotographerId}`);
                }
            }

            // Safely parse date
            let parsedDate = new Date();
            if (formatted.date) {
                const d = new Date(formatted.date);
                if (!isNaN(d.getTime())) {
                    parsedDate = d;
                }
            }

            // Insert or Update in our Database
            const bookingData: any = {
                protocol: String(formatted.protocol || `TEMP-${Date.now()}`),
                clientName: String(formatted.clientName || 'Cliente Desconhecido'),
                clientEmail: String(formatted.clientEmail || 'contato@apolar.com.br'),
                clientPhone: String(formatted.clientPhone || '(41) 99999-9999'),
                brokerDetails: formatted.brokerDetails ? String(formatted.brokerDetails) : null,
                address: String(formatted.address || 'Endereço não informado'),
                neighborhood: String(formatted.neighborhood || 'Bairro conforme contrato'),
                city: String(formatted.city || 'Curitiba'),
                zipCode: formatted.zipCode ? String(formatted.zipCode) : '80000-000',
                complement: formatted.complement ? String(formatted.complement) : null,
                services: Array.isArray(formatted.services) ? formatted.services : [],
                date: parsedDate,
                time: String(formatted.time || '08:00'),
                duration: 60,
                status: finalStatus,
                photographerId: mappedPhotographerId,
                propertyType: formatted.propertyType ? String(formatted.propertyType) : null,
                latitude: typeof formatted.latitude === 'number' ? formatted.latitude : null,
                longitude: typeof formatted.longitude === 'number' ? formatted.longitude : null
            };

            console.log(`[DEBUG] Syncing ${protocol}. Fields and Types:`);
            Object.keys(bookingData).forEach(key => {
                const val = bookingData[key];
                console.log(`  - ${key}: ${typeof val} (${val})`);
            });

            if (existing) {
                console.log(`[DEBUG] Updating existing Booking ${protocol} with new data including coords and photographer.`);
                await prisma.booking.update({
                    where: { protocol: protocol as string },
                    data: bookingData
                });
                imported++; // Count as updated for the response
            } else {
                console.log(`[DEBUG] Creating new Booking with data:`, JSON.stringify(bookingData, null, 2));
                await prisma.booking.create({
                    data: bookingData
                });
                imported++;
            }
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

        // Handle specifically Prisma errors to return more details
        let errorMessage = error.message;
        if (error.code === 'P2002') {
            errorMessage = `Duplicate field: ${error.meta?.target}`;
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            stack: error.stack,
            type: error.constructor.name,
            details: error.response?.data || error.data || error.meta
        }, { status: 500 });
    }
}
