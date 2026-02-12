import { prisma } from '@/lib/prisma';
import SecretaryDashboard from '@/components/SecretaryDashboard';

export const dynamic = 'force-dynamic';

export default async function SecretaryPage() {
    // Fetch all active photographers
    const photographers = await prisma.photographer.findMany({
        where: { active: true },
        include: {
            timeBlocks: true,
            bookings: {
                where: {
                    status: { not: 'CANCELED' },
                    date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)) // From today onwards
                    }
                }
            }
        }
    });

    // Serialize for Client Component
    const serializedPhotographers = photographers.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        bookings: p.bookings.map(b => ({
            id: b.id,
            date: b.date.toISOString().split('T')[0],
            time: b.time,
            duration: b.duration,
            clientName: b.clientName,
            protocol: b.protocol,
            services: b.services // Added services
        })),
        blocks: p.timeBlocks.map(b => ({
            id: b.id,
            date: b.date.toISOString().split('T')[0],
            startTime: b.startTime,
            endTime: b.endTime,
            reason: b.reason
        }))
    }));

    // Fetch unassigned bookings
    const unassignedBookings = await prisma.booking.findMany({
        where: {
            photographerId: null,
            status: { not: 'CANCELED' },
            date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        }
    });

    const serializedUnassigned = unassignedBookings.map(b => ({
        id: b.id,
        date: b.date.toISOString().split('T')[0],
        time: b.time,
        duration: b.duration,
        clientName: b.clientName,
        protocol: b.protocol,
        services: b.services
    }));

    return (
        <div className="min-h-screen bg-slate-50">
            <SecretaryDashboard
                photographers={serializedPhotographers}
                unassignedBookings={serializedUnassigned}
            />
        </div>
    );
}
