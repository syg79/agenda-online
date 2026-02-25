import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { tadabase, FIELDS } from '@/lib/tadabase';

const prisma = new PrismaClient();

async function executeTadabasePull() {
    console.log('[API] Starting Tadabase Pull...');
    const rawRecords = await tadabase.getVercelTestBookings();

    if (!rawRecords || rawRecords.length === 0) {
        return { success: true, message: 'Nenhum registro com "Enviar Vercel=Sim" encontrado.', imported: 0, skipped: 0, errors: 0, totalFound: 0 };
    }

    let imported = 0;
    let errors = 0;
    let skipped = 0;

    const photographers = await prisma.photographer.findMany({
        select: { id: true, name: true }
    });

    for (const record of rawRecords) {
        const protocol = record[FIELDS.protocolNew] || record[FIELDS.protocol];

        if (!protocol) {
            errors++;
            continue;
        }

        const existing = await prisma.booking.findUnique({
            where: { protocol: protocol as string }
        });

        const formatted = tadabase.formatRecord(record);

        if (!formatted) {
            errors++;
            continue;
        }

        // Photographer mapping
        let mappedPhotographerId = null;
        let finalStatus = 'PENDING';

        if (formatted.photographerName) {
            const match = photographers.find(p => p.name.toLowerCase() === formatted.photographerName.toLowerCase());
            if (match) {
                mappedPhotographerId = match.id;
                finalStatus = 'CONFIRMED';
            }
        }

        let parsedDate = new Date();
        if (formatted.date) {
            const d = new Date(formatted.date);
            if (!isNaN(d.getTime())) parsedDate = d;
        }

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

        try {
            if (existing) {
                await prisma.booking.update({
                    where: { protocol: protocol as string },
                    data: bookingData
                });
            } else {
                await prisma.booking.create({ data: bookingData });
            }
            imported++;
        } catch (err: any) {
            console.error(`[API] Error syncing ${protocol}:`, err.message);
            errors++;
        }
    }

    console.log(`[API] Tadabase Pull Finished: ${imported} imported, ${skipped} skipped, ${errors} errors.`);

    return {
        success: true,
        imported,
        skipped,
        errors,
        totalFound: rawRecords.length
    };
}

// POST - Manual button from Dashboard
export async function POST() {
    try {
        const result = await executeTadabasePull();

        await prisma.syncLog.create({
            data: {
                source: 'tadabase-pull',
                status: result.errors > 0 && result.imported === 0 ? 'error' : 'success',
                imported: result.imported,
                errors: result.errors,
                details: result as any
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API] Tadabase Pull Error:', error);

        await prisma.syncLog.create({
            data: {
                source: 'tadabase-pull',
                status: 'error',
                errors: 1,
                details: { error: error.message }
            }
        }).catch(() => { });

        return NextResponse.json({
            success: false,
            error: error.message,
            type: error.constructor.name
        }, { status: 500 });
    }
}

// GET - For future Vercel Cron Job
export async function GET(request: NextRequest) {
    // Verify cron secret when called by Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await executeTadabasePull();

        await prisma.syncLog.create({
            data: {
                source: 'tadabase-pull',
                status: result.errors > 0 && result.imported === 0 ? 'error' : 'success',
                imported: result.imported,
                errors: result.errors,
                details: { ...result as any, trigger: 'cron' }
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API] Tadabase Cron Pull Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
