import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/distance';

// --- Interfaces ---

export interface Photographer {
    id: string; // Tadabase Record ID (or internal ID)
    name: string;
    email: string;
    capabilities: string[]; // Service IDs or 'ALL'
    coverage: any; // JSON Object: { "photo": ["A"], "video": ["B"] }
    latitude?: number | null;
    longitude?: number | null;
    travelRadius?: number | null;
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

// --- Helper Functions (Async) ---

async function getActivePhotographers(): Promise<Photographer[]> {
    const dbPhotographers = await prisma.photographer.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            email: true,
            services: true,
            neighborhoods: true // Now JSON
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
 * Filter photographers who cover a specific neighborhood for a specific service.
 */
export async function getPhotographersForNeighborhood(neighborhood: string, serviceId?: string): Promise<Photographer[]> {
    const photographers = await getActivePhotographers();

    if (!neighborhood) return photographers;

    const normalizedNeighborhood = neighborhood.trim().toLowerCase();

    return photographers.filter(p => {
        // Basic Legacy Check
        if (Array.isArray(p.coverage)) {
            if (p.coverage.includes('ALL')) return true;
            return p.coverage.some((c: string) => c.trim().toLowerCase() === normalizedNeighborhood);
        }

        // JSON Check
        if (p.coverage && typeof p.coverage === 'object') {
            // If no service specified, check if ANY service covers it
            if (!serviceId) {
                return Object.values(p.coverage).some((list: any) => {
                    if (Array.isArray(list)) {
                        if (list.includes('ALL')) return true;
                        return list.some((c: string) => c.trim().toLowerCase() === normalizedNeighborhood);
                    }
                    return false;
                });
            }

            // Specific Service Check
            const list = p.coverage[serviceId];
            if (Array.isArray(list)) {
                if (list.includes('ALL')) return true;
                return list.some((c: string) => c.trim().toLowerCase() === normalizedNeighborhood);
            }
        }

        return false;
    });
}

/**
 * Filter photographers who can perform ALL requested services.
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
 * Combines Location and Capabilities.
 * 
 * LOGIC UPDATE:
 * 1. Must implement ALL capabilities (Technical Skill)
 * 2. Must cover the location for AT LEAST ONE of the requested services (Logistic feasibility)
 */
// Update signature to accept optional coordinates
export async function getValidPhotographers(
    neighborhood: string,
    serviceIds: string[],
    clientLat?: number,
    clientLng?: number
): Promise<Photographer[]> {
    // We fetch all active once to avoid multiple DB calls
    // Phase 5: Also fetch lat/lng/travelRadius
    const allPhotographersRaw = await prisma.photographer.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            email: true,
            services: true,
            neighborhoods: true,
            latitude: true,
            longitude: true,
            travelRadius: true
        }
    });

    const allPhotographers = allPhotographersRaw.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        capabilities: p.services,
        coverage: p.neighborhoods,
        latitude: p.latitude,
        longitude: p.longitude,
        travelRadius: p.travelRadius || 15 // Default 15km
    }));

    // 1. Capability Check (Strict: Must be able to do the job)
    const capablePhotographers = allPhotographers.filter(p => {
        if (p.capabilities.includes('ALL')) return true;
        if (!serviceIds || serviceIds.length === 0) return true;
        return serviceIds.every(s => p.capabilities.includes(s));
    });

    // 2. Coverage Check (Flexible: If I go for Video, I can do Photo too)
    return capablePhotographers.filter(p => {
        // --- PHASE 5: SHADOW MODE START ---
        if (clientLat && clientLng && p.latitude && p.longitude) {
            const dist = calculateDistance(clientLat, clientLng, p.latitude, p.longitude);
            const isWithinRadius = dist <= (p.travelRadius || 15);

            // Log for analysis (Shadow Mode)
            // In production this would be a proper log service
            // console.log(`[SHADOW_MODE] ${p.name}: Dist=${dist}km. Radius=${p.travelRadius}km. Covered=${isWithinRadius}`);
        }
        // --- PHASE 5: SHADOW MODE END ---

        if (!neighborhood) return true;

        const normalizedNeighborhood = neighborhood.trim().toLowerCase();
        const coverage = p.coverage as any;

        // Legacy Array Handling
        if (Array.isArray(coverage)) {
            if (coverage.includes('ALL')) return true;
            return coverage.some((c: string) => c.trim().toLowerCase() === normalizedNeighborhood);
        }

        // JSON Handling
        if (coverage && typeof coverage === 'object') {
            // If 'ALL' services requested or empty, assume generic check
            if (!serviceIds || serviceIds.length === 0) {
                return Object.values(coverage).some((list: any) => {
                    if (Array.isArray(list)) {
                        if (list.includes('ALL')) return true;
                        return list.some((c: string) => c.trim().toLowerCase() === normalizedNeighborhood);
                    }
                    return false;
                });
            }

            // Logic: Is there ANY service in the request that authorizes travel to this neighborhood?
            return serviceIds.some(serviceId => {
                const list = coverage[serviceId];
                if (Array.isArray(list)) {
                    if (list.includes('ALL')) return true;
                    return list.some((c: string) => c.trim().toLowerCase() === normalizedNeighborhood);
                }
                return false;
            });
        }

        return false; // No coverage data found -> Not covered
    });
}
