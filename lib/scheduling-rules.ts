import { prisma } from '@/lib/prisma';

// --- Interfaces ---

export interface Photographer {
    id: string; // Tadabase Record ID (or internal ID)
    name: string;
    email: string;
    capabilities: string[]; // Service IDs or 'ALL'
    coverage: string[]; // Neighborhood names or 'ALL'
}

// --- CONSTANTS: CURITIBA NEIGHBORHOODS (Official List) ---
export const CURITIBA_NEIGHBORHOODS = [
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

// --- Helper Functions (Now Async) ---

async function getActivePhotographers(): Promise<Photographer[]> {
    const dbPhotographers = await prisma.photographer.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            email: true,
            services: true,
            neighborhoods: true
        }
    });

    return dbPhotographers.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        capabilities: p.services,
        coverage: p.neighborhoods
    }));
}

/**
 * Filter photographers who cover a specific neighborhood.
 * Handles 'ALL' wildcard.
 */
export async function getPhotographersForNeighborhood(neighborhood: string): Promise<Photographer[]> {
    const photographers = await getActivePhotographers();

    if (!neighborhood) return photographers;

    const normalizedNeighborhood = neighborhood.trim().toLowerCase();

    return photographers.filter(p => {
        if (p.coverage.includes('ALL')) return true;
        return p.coverage.some(c => c.trim().toLowerCase() === normalizedNeighborhood);
    });
}

/**
 * Filter photographers who can perform ALL requested services.
 * Handles 'ALL' wildcard.
 */
export async function getPhotographersForServices(serviceIds: string[]): Promise<Photographer[]> {
    const photographers = await getActivePhotographers();

    if (!serviceIds || serviceIds.length === 0) return photographers;

    return photographers.filter(p => {
        if (p.capabilities.includes('ALL')) return true;
        return serviceIds.every(s => p.capabilities.includes(s));
    });
}

/**
 * Main function to get valid photographers for a booking.
 * Combines Location and Service constraints.
 */
export async function getValidPhotographers(neighborhood: string, serviceIds: string[]): Promise<Photographer[]> {
    // We fetch all active once to avoid multiple DB calls
    const allPhotographers = await getActivePhotographers();

    // 1. Filter by Location
    const byLocation = allPhotographers.filter(p => {
        if (!neighborhood) return true;
        if (p.coverage.includes('ALL')) return true;
        return p.coverage.some(c => c.trim().toLowerCase() === neighborhood.trim().toLowerCase());
    });

    // 2. Filter by Capabilities (Services)
    return byLocation.filter(p => {
        if (p.capabilities.includes('ALL')) return true;
        if (!serviceIds || serviceIds.length === 0) return true;
        return serviceIds.every(s => p.capabilities.includes(s));
    });
}
