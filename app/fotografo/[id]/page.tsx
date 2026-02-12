import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PhotographerCalendar from '@/components/PhotographerCalendar';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function PhotographerPage({ params }: PageProps) {
    const { id } = params;

    // Validate UUID format to prevent database errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return notFound();
    }

    const photographer = await prisma.photographer.findUnique({
        where: { id },
        include: {
            timeBlocks: true
        }
    });

    if (!photographer || !photographer.active) {
        return notFound();
    }

    // Serialize blocks directly
    const blocks = photographer.timeBlocks.map(block => ({
        id: block.id,
        date: block.date.toISOString().split('T')[0],
        startTime: block.startTime,
        endTime: block.endTime,
        reason: block.reason || undefined
    }));

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Área do Fotógrafo: <span className="text-blue-600">{photographer.name}</span>
                    </h1>
                    <p className="text-slate-600">
                        Gerencie sua disponibilidade. Dias em vermelho indicam bloqueios.
                    </p>
                </div>

                <PhotographerCalendar
                    photographerId={photographer.id}
                    initialBlocks={blocks}
                />
            </div>
        </div>
    );
}
