
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAugusto() {
    try {
        const augusto = await prisma.photographer.findFirst({
            where: { name: { contains: 'Augusto', mode: 'insensitive' } },
        });

        if (augusto) {
            console.log('Found Augusto:', {
                id: augusto.id,
                name: augusto.name,
                baseAddress: augusto.baseAddress,
                baseLat: augusto.baseLat,
                baseLng: augusto.baseLng,
            });
        } else {
            console.log('Photographer "Augusto" not found.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAugusto();
