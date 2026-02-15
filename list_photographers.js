
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const photographers = await prisma.photographer.findMany({
        where: { active: true },
    });
    console.log(JSON.stringify(photographers, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
