
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

async function main() {
    console.log('🔍 Checking Database Content...');
    const count = await prisma.booking.count();
    console.log(`Total Bookings: ${count}`);

    if (count > 0) {
        const sample = await prisma.booking.findMany({ take: 3 });
        console.log('--- SAMPLES ---');
        console.dir(sample, { depth: null });

        const statuses = await prisma.booking.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });
        console.log('--- STATUS COUNTS ---');
        console.log(statuses);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
