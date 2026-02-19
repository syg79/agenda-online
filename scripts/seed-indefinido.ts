
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verificando existência do Fotógrafo Indefinido...');

    const exists = await prisma.photographer.findFirst({
        where: {
            name: 'Fotógrafo Indefinido'
        }
    });

    if (exists) {
        console.log('Fotógrafo Indefinido já existe.');
        return;
    }

    console.log('Criando Fotógrafo Indefinido...');

    await prisma.photographer.create({
        data: {
            name: 'Fotógrafo Indefinido',
            email: 'indefinido@agenda.com',
            color: '#94a3b8', // Slate 400 (Grey)
            active: true,
            services: ['FOTO', 'VIDEO', 'DRONE'], // Able to do everything by default?
            neighborhoods: [],
            // Base location irrelevant
        }
    });

    console.log('Fotógrafo Indefinido criado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
