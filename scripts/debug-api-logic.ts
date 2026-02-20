
import 'dotenv/config';

// Mock fetch if needed, but we can't easily mock NextRequest/NextResponse in a standalone script without more setup.
// Instead, we will simulate the logic of the route.ts using the sameprisma queries.

import { prisma } from '@/lib/prisma';

async function main() {
    console.log('🔍 Testing Dashboard API Logic...');

    try {
        const pending = await prisma.booking.findMany({
            where: {
                photographerId: null,
                status: { not: 'CANCELED' },
            },
            take: 5
        });

        console.log(`Found ${pending.length} pending bookings (Sample logic).`);
        console.dir(pending, { depth: null });

    } catch (e) {
        console.error(e);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
