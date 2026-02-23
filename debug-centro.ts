import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCentro() {
    const pending = await prisma.booking.findMany({
        where: {
            status: { in: ['PENDING', 'PENDENTE', 'WAITING'] },
            photographerId: null,
            latitude: { not: null },
            longitude: { not: null },
            address: { contains: 'Sete de Abril' }
        },
        take: 10
    });

    console.log("Found Sete de Abril:", pending.map(p => ({
        id: p.id,
        name: p.clientName,
        address: p.address,
        neighborhood: p.neighborhood
    })));

    const all = await prisma.booking.findMany({
        where: {
            status: { in: ['PENDING', 'PENDENTE', 'WAITING'] },
            photographerId: null
        },
        take: 10
    });
    console.log("Some pendings:", all.map(p => ({
        id: p.id,
        name: p.clientName,
        address: p.address,
        lat: p.latitude,
        lng: p.longitude
    })));
}

checkCentro().finally(() => prisma.$disconnect());
