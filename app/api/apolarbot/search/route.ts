import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { scrapeProperty, isMaintenanceWindow, validateRef } from '@/lib/apolar-scraper';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const ref = request.nextUrl.searchParams.get('ref')?.trim();

    if (!ref) {
        return NextResponse.json({ error: 'Parâmetro "ref" obrigatório' }, { status: 400 });
    }

    if (!validateRef(ref)) {
        return NextResponse.json({ error: 'Referência inválida. Deve conter 6 dígitos numéricos.' }, { status: 400 });
    }

    try {
        // 1. Check cache first
        const cached = await prisma.property.findUnique({ where: { ref } });
        if (cached) {
            console.log(`[ApolarBot] Cache hit for REF ${ref}`);
            return NextResponse.json({
                success: true,
                source: 'cache',
                data: cached
            });
        }

        // 2. Check maintenance window (02:00-06:00 BRT)
        if (isMaintenanceWindow()) {
            return NextResponse.json({
                success: false,
                error: 'O sistema da Apolar está em manutenção entre 02:00 e 06:00. Tente novamente após as 06:00.',
                maintenanceWindow: true
            }, { status: 503 });
        }

        // 3. Scrape on-demand
        console.log(`[ApolarBot] Cache miss for REF ${ref}, starting scrape...`);
        const scrapedData = await scrapeProperty(ref);

        // 4. Save to cache
        const property = await prisma.property.create({
            data: {
                ref: scrapedData.ref,
                address: scrapedData.address,
                neighborhood: scrapedData.neighborhood,
                city: scrapedData.city,
                state: scrapedData.state,
                zipCode: scrapedData.zipCode,
                propertyType: scrapedData.propertyType,
                area: scrapedData.area,
                bedrooms: scrapedData.bedrooms,
                parkingSpaces: scrapedData.parkingSpaces,
                brokerName: scrapedData.brokerName,
                storeName: scrapedData.storeName,
                price: scrapedData.price,
                latitude: scrapedData.latitude,
                longitude: scrapedData.longitude,
                building: scrapedData.building,
                description: scrapedData.description,
                situation: scrapedData.situation,
                rawData: scrapedData as any
            }
        });

        // 5. Log sync
        await prisma.syncLog.create({
            data: {
                source: 'apolarbot',
                status: 'success',
                imported: 1,
                details: { ref, source: 'scrape' }
            }
        });

        return NextResponse.json({
            success: true,
            source: 'scrape',
            data: property
        });

    } catch (error: any) {
        console.error(`[ApolarBot] Error for REF ${ref}:`, error);

        await prisma.syncLog.create({
            data: {
                source: 'apolarbot',
                status: 'error',
                errors: 1,
                details: { ref, error: error.message }
            }
        }).catch(() => { });

        return NextResponse.json({
            success: false,
            error: error.message || 'Erro ao buscar imóvel',
            ref
        }, { status: 500 });
    }
}
