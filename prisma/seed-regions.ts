
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CURITIBA_NEIGHBORHOODS = [
    "Abranches", "Água Verde", "Ahú", "Alto Boqueirão", "Alto da Glória", "Alto da XV",
    "Atuba", "Augusta", "Bacacheri", "Bairro Alto", "Barreirinha", "Batel", "Bigorrilho",
    "Boa Vista", "Bom Retiro", "Boqueirão", "Butiatuvinha", "Cabral", "Cachoeira", "Cajuru",
    "Campina do Siqueira", "Campo Comprido", "Campo de Santana", "Capão da Imbuia", "Capão Raso",
    "Cascatinha", "Caximba", "Centro", "Centro Cívico", "Cidade Industrial de Curitiba",
    "Cristo Rei", "Fanny", "Fazendinha", "Ganchinho", "Guabirotuba", "Guaíra", "Hauer",
    "Hugo Lange", "Jardim Botânico", "Jardim das Américas", "Jardim Social", "Juvevê",
    "Lamenha Pequena", "Lindóia", "Mercês", "Mossunguê", "Novo Mundo", "Orleans", "Parolin",
    "Pilarzinho", "Pinheirinho", "Portão", "Prado Velho", "Rebouças", "Riviera", "Santa Cândida",
    "Santa Felicidade", "Santa Quitéria", "Santo Inácio", "São Braz", "São Francisco", "São João",
    "São Lourenço", "São Miguel", "Seminário", "Sítio Cercado", "Taboão", "Tarumã", "Tatuquara",
    "Tingui", "Uberaba", "Umbará", "Vila Izabel", "Vista Alegre", "Xaxim"
];

async function main() {
    console.log(`Start seeding ${CURITIBA_NEIGHBORHOODS.length} neighborhoods...`);

    // Create a single Region called "Curitiba" containing all neighborhoods
    // This fits the schema which has 'neighborhoods' as string[]

    const regionName = "Curitiba (Todos)";

    const existing = await prisma.region.findFirst({
        where: { name: regionName }
    });

    if (existing) {
        console.log(`Region '${regionName}' already exists. Updating neighborhoods...`);
        await prisma.region.update({
            where: { id: existing.id },
            data: {
                neighborhoods: CURITIBA_NEIGHBORHOODS,
                cities: ["Curitiba"]
            }
        });
    } else {
        console.log(`Creating Region '${regionName}'...`);
        await prisma.region.create({
            data: {
                name: regionName,
                cities: ["Curitiba"],
                neighborhoods: CURITIBA_NEIGHBORHOODS
            }
        });
    }

    // Optional: Create individual Regions for each if needed, but the Schema suggests 'neighborhoods' is an array on Region.
    // The user wants to assign Neighborhoods to Photographers.
    // The `PhotographerRegion` links Photographer -> Region.
    // If we have 1 big region "Curitiba", linking it means they cover *all* of Curitiba.
    // Detailed mapping (Photographer -> Specific Neighborhoods) isn't directly supported by `PhotographerRegion` unless we create 75 Regions?
    // Let's check Schema: `PhotographerRegion` links `Region`. `Region` has `neighborhoods[]`.
    // If we want detailed granular control, we might need a different approach or rely on the `coverage` field in `Photographer` JSON/Array logic?
    // Actually, `Photographer` has no `coverage` field in `schema.prisma`! It has `regions`.

    // Pivot: To support "Select Neighborhoods for Photographer", we probably need to store this preference.
    // We can add a `neighborhoods` string[] field to `Photographer` model or use the `Region` concept differently.
    // For now, I will seed a "Metadata" region just to hold the list.

    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
