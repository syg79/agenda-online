import { findOrdersForSlot } from './lib/services/smart-scheduling';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const p = await prisma.photographer.findFirst({ where: { name: { contains: 'Augusto' } } });
    if (!p) return;
    try {
        const suggestions = await findOrdersForSlot(p.id, '2026-02-23', '13:00');
        console.log("Suggestions for 13:00 (Symmetric Math):");
        console.table(suggestions.slice(0, 15).map((s: any) => ({
            client: s.clientName,
            distTotal: s.distanceKm,
            info: s.extraInfo,
            score: s.sortScore,
            addr: s.address.substring(0, 20)
        })));
    } catch (e) {
        console.error(e);
    }
}
run().finally(() => prisma.$disconnect());
