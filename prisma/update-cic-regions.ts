
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CURITIBA_NEIGHBORHOODS_UPDATED = [
    "Abranches", "Água Verde", "Ahú", "Alto Boqueirão", "Alto da Glória", "Alto da XV",
    "Atuba", "Augusta", "Bacacheri", "Bairro Alto", "Barreirinha", "Batel", "Bigorrilho",
    "Boa Vista", "Bom Retiro", "Boqueirão", "Butiatuvinha", "Cabral", "Cachoeira", "Cajuru",
    "Campina do Siqueira", "Campo Comprido", "Campo de Santana", "Capão da Imbuia", "Capão Raso",
    "Cascatinha", "Caximba", "Centro", "Centro Cívico",
    "CIC Norte", "CIC Central", "CIC Sul", // Replcaes "Cidade Industrial de Curitiba"
    "Cristo Rei", "Fanny", "Fazendinha", "Ganchinho", "Guabirotuba", "Guaíra", "Hauer",
    "Hugo Lange", "Jardim Botânico", "Jardim das Américas", "Jardim Social", "Juvevê",
    "Lamenha Pequena", "Lindóia", "Mercês", "Mossunguê", "Novo Mundo", "Orleans", "Parolin",
    "Pilarzinho", "Pinheirinho", "Portão", "Prado Velho", "Rebouças", "Riviera", "Santa Cândida",
    "Santa Felicidade", "Santa Quitéria", "Santo Inácio", "São Braz", "São Francisco", "São João",
    "São Lourenço", "São Miguel", "Seminário", "Sítio Cercado", "Taboão", "Tarumã", "Tatuquara",
    "Tingui", "Uberaba", "Umbará", "Vila Izabel", "Vista Alegre", "Xaxim"
];

async function main() {
    console.log(`Updating neighborhoods to include CIC subdivisions...`);

    const regionName = "Curitiba (Todos)";

    const existing = await prisma.region.findFirst({
        where: { name: regionName }
    });

    if (existing) {
        await prisma.region.update({
            where: { id: existing.id },
            data: {
                neighborhoods: CURITIBA_NEIGHBORHOODS_UPDATED
            }
        });
        console.log("Updated 'Curitiba (Todos)' with CIC Norte/Central/Sul.");
    } else {
        console.error("Region not found!");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
