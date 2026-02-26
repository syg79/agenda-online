import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateRef, isMaintenanceWindow } from '@/lib/apolar-scraper';

const prisma = new PrismaClient();

const WORKER_URL = process.env.SCRAPER_WORKER_URL || 'http://163.176.48.60:3034';
const WORKER_TOKEN = process.env.WORKER_TOKEN || 'vitrine2026';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const ref = body.ref?.trim();

    if (!ref || !validateRef(ref)) {
        return Response.json({ error: 'Referência inválida. Deve conter 6 dígitos.' }, { status: 400 });
    }

    // Check cache first
    const cached = await prisma.property.findUnique({ where: { ref } });
    if (cached) {
        // Check for existing bookings with this REF
        const bookings = await prisma.booking.findMany({
            where: { notes: { contains: `Ref: ${ref}` } },
            select: { id: true, date: true, status: true, clientName: true, services: true },
            orderBy: { date: 'desc' },
            take: 5
        });
        return Response.json({ success: true, source: 'cache', data: cached, bookings });
    }

    // Maintenance check
    if (isMaintenanceWindow()) {
        return Response.json({ error: 'Opção indisponível entre 02:00 e 06:00.' }, { status: 503 });
    }

    // Create job
    const job = await prisma.scrapeJob.create({
        data: { ref, status: 'pending', percent: 0, step: 'Na fila...' }
    });

    // Fire-and-forget to Oracle VM worker
    try {
        fetch(`${WORKER_URL}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-worker-token': WORKER_TOKEN },
            body: JSON.stringify({ jobId: job.id, ref })
        }).catch(err => console.error('[ApolarBot] Worker call failed:', err.message));
    } catch (err: any) {
        console.error('[ApolarBot] Worker unreachable:', err.message);
    }

    // Return immediately with jobId
    return Response.json({ success: true, jobId: job.id, status: 'processing' });
}

// GET for cache-only lookup (backward compat)
export async function GET(request: NextRequest) {
    const ref = request.nextUrl.searchParams.get('ref')?.trim();

    if (!ref || !validateRef(ref)) {
        return Response.json({ error: 'Referência inválida.' }, { status: 400 });
    }

    const cached = await prisma.property.findUnique({ where: { ref } });
    if (cached) {
        return Response.json({ success: true, source: 'cache', data: cached });
    }

    return Response.json({ success: false, error: 'Não encontrado no cache.' }, { status: 404 });
}
