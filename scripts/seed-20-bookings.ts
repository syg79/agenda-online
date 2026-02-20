
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const neighborhoods = [
    'Batel', 'Água Verde', 'Centro Cívico', 'Bigorrilho', 'Mercês',
    'Portão', 'Cabral', 'Juvevê', 'Cristo Rei', 'Vila Izabel'
];

const streets = [
    'Rua Sete de Setembro', 'Av. Batel', 'Rua Martim Afonso', 'Av. República Argentina',
    'Rua Padre Anchieta', 'Rua Mateus Leme', 'Av. Paraná', 'Rua Itupava',
    'Rua XV de Novembro', 'Av. Iguaçu', 'Rua Desembargador Motta', 'Rua 24 de Maio'
];

const names = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Souza', 'Carlos Pereira',
    'Fernanda Costa', 'Rafael Lima', 'Juliana Alves', 'Bruno Rocha', 'Camila Dias'
];

const servicesList = ['Foto', 'Vídeo', 'Drone', 'Tour 360', 'Planta Baixa'];

function getRandomItem(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomCoordinates() {
    // Curitiba Bounds roughly
    const lat = -25.4284 + (Math.random() - 0.5) * 0.1;
    const lng = -49.2733 + (Math.random() - 0.5) * 0.1;
    return { lat, lng };
}

async function main() {
    console.log('Cleaning existing bookings...');
    await prisma.booking.deleteMany({});

    console.log('Seeding 20 new bookings...');

    const statusOptions = ['PENDING', 'PENDING', 'PENDING', 'CONFIRMED', 'CONFIRMED'];

    const photographers = await prisma.photographer.findMany();
    if (photographers.length === 0) {
        throw new Error('No photographers found. Run seed script first.');
    }

    for (let i = 0; i < 20; i++) {
        const nb = getRandomItem(neighborhoods);
        const street = getRandomItem(streets);
        const number = Math.floor(Math.random() * 2000) + 1;
        const client = getRandomItem(names);
        const { lat, lng } = getRandomCoordinates();
        const numServices = Math.floor(Math.random() * 3) + 1;
        const services = Array.from({ length: numServices }, () => getRandomItem(servicesList));
        const uniqueServices = Array.from(new Set(services));

        const status = getRandomItem(statusOptions);

        let photographerId = null;
        let date = new Date();
        let time = null;

        if (status === 'CONFIRMED') {
            photographerId = getRandomItem(photographers).id;
            // Schedule for today or tomorrow
            const d = new Date();
            if (Math.random() > 0.5) d.setDate(d.getDate() + 1);
            date = d;

            const hour = Math.floor(Math.random() * (17 - 8 + 1)) + 8;
            time = `${hour < 10 ? '0' : ''}${hour}:00`;
        }

        await prisma.booking.create({
            data: {
                clientName: client,
                clientEmail: `test${i}@example.com`,
                clientPhone: '41999999999',
                services: uniqueServices,
                address: `${street}, ${number}`,
                neighborhood: nb,
                city: 'Curitiba',
                state: 'PR',
                zipCode: '80000-000',
                latitude: lat,
                longitude: lng,
                status: status,
                protocol: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
                photographerId,
                date,
                time: time || '00:00', // Default if pending
                duration: 60,
                price: 150.00
            }
        });
    }

    console.log('Done! 20 bookings created.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
