
import { prisma } from '../lib/prisma';
import { getRouteByCluster } from '../lib/services/routing';

// Full List of 75 Curitiba Neighborhoods (Official)
// We use the NAME as the key for the Cluster Matrix (75x75).
// 100% Coverage Strategy: Every specific CEP maps to one of these neighboorhoods.

const CURITIBA_NEIGHBORHOODS = [
    "Abranches", "Água Verde", "Ahú", "Alto Boqueirão", "Alto da Glória", "Alto da XV",
    "Atuba", "Augusta", "Bacacheri", "Bairro Alto", "Barreirinha", "Batel", "Bigorrilho",
    "Boa Vista", "Bom Retiro", "Boqueirão", "Butiatuvinha", "Cabral", "Cachoeira", "Cajuru",
    "Campina do Siqueira", "Campo Comprido", "Campo de Santana", "Capão da Imbuia", "Capão Raso",
    "Cascatinha", "Caximba", "Centro", "Centro Cívico", "Cidade Industrial",
    "Cristo Rei", "Fanny", "Fazendinha", "Ganchinho", "Guabirotuba", "Guaíra", "Hauer",
    "Hugo Lange", "Jardim Botânico", "Jardim das Américas", "Jardim Social", "Juvevê",
    "Lamenha Pequena", "Lindóia", "Mercês", "Mossunguê", "Novo Mundo", "Orleans", "Parolin",
    "Pilarzinho", "Pinheirinho", "Portão", "Prado Velho", "Rebouças", "Riviera", "Santa Cândida",
    "Santa Felicidade", "Santa Quitéria", "Santo Inácio", "São Braz", "São Francisco", "São João",
    "São Lourenço", "São Miguel", "Seminário", "Sítio Cercado", "Taboão", "Tarumã", "Tatuquara",
    "Tingui", "Uberaba", "Umbará", "Vila Izabel", "Vista Alegre", "Xaxim"
];

async function seedRoutes() {
    const totalNeighborhoods = CURITIBA_NEIGHBORHOODS.length;
    const totalRoutes = totalNeighborhoods * (totalNeighborhoods - 1);

    console.log(`🚀 Starting Full Cluster Matrix Generation (Neighborhood -> Neighborhood)...`);
    console.log(`📊 Target: ${totalRoutes} unique cluster routes.`);

    let count = 0;
    const batchSize = 100;

    // Iterate every pair (NameA -> NameB)
    for (const nameA of CURITIBA_NEIGHBORHOODS) {
        for (const nameB of CURITIBA_NEIGHBORHOODS) {
            if (nameA === nameB) continue;

            // This calls our service which:
            // 1. Checks Cache for "Centro" -> "Batel" (Neighborhood Names)
            // 2. Or Calculates (Mock/OSRM using cached coords)
            // 3. Saves to DB
            await getRouteByCluster(nameA, nameB);

            count++;
            if (count % batchSize === 0) {
                const percent = ((count / totalRoutes) * 100).toFixed(1);
                process.stdout.write(`\rProgress: ${count}/${totalRoutes} (${percent}%)   `);
            }
        }
    }

    console.log(`\n✅ Finished! ${count} cluster routes processed.`);
    console.log("The 'Giant Matrix' is complete and now covers ALL CEPs via Clustering.");
}

seedRoutes()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
