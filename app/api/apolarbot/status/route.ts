import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get('jobId')?.trim();

    if (!jobId) {
        return Response.json({ error: 'Parâmetro "jobId" obrigatório' }, { status: 400 });
    }

    const job = await prisma.scrapeJob.findUnique({ where: { id: jobId } });

    if (!job) {
        return Response.json({ error: 'Job não encontrado' }, { status: 404 });
    }

    if (job.status === 'complete') {
        // Fetch full property data
        const property = await prisma.property.findUnique({ where: { ref: job.ref } });
        let bookings: any[] = [];
        if (property) {
            bookings = await prisma.booking.findMany({
                where: { notes: { contains: `Ref: ${job.ref}` } },
                select: { id: true, date: true, time: true, status: true, clientName: true, services: true },
                orderBy: { date: 'desc' },
                take: 5
            });
        }
        return Response.json({
            status: 'complete',
            percent: 100,
            step: 'Concluído!',
            data: property || job.result,
            bookings
        });
    }

    if (job.status === 'error') {
        return Response.json({
            status: 'error',
            percent: job.percent,
            step: job.step,
            error: job.error || 'Erro desconhecido'
        });
    }

    // Still processing
    return Response.json({
        status: job.status,
        percent: job.percent,
        step: job.step
    });
}
