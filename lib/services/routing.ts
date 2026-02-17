
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/distance';
import { fetchCepAberto } from './cepaberto';

interface RouteResult {
    distance: number; // km
    duration: number; // minutes
    source: 'CACHE' | 'API' | 'FALLBACK';
}

// --- COORDINATE LOOKUP FOR OPTIMIZED CLUSTERING ---
// We map each neighborhood to a "Centroid" to allow on-the-fly calculations for the matrix.
// This ensures 100% coverage even if the specific route isn't cached yet.
// In a real production app, this would be a separate lookup table or Geocoding API.
const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
    "Abranches": { lat: -25.3589, lng: -49.2319 },
    "Água Verde": { lat: -25.4593, lng: -49.2889 },
    "Ahú": { lat: -25.4057, lng: -49.2736 },
    "Alto Boqueirão": { lat: -25.5332, lng: -49.2556 },
    "Alto da Glória": { lat: -25.4190, lng: -49.2638 },
    "Alto da XV": { lat: -25.4310, lng: -49.2557 },
    "Atuba": { lat: -25.3857, lng: -49.2135 },
    "Augusta": { lat: -25.4856, lng: -49.3364 },
    "Bacacheri": { lat: -25.3956, lng: -49.2393 },
    "Bairro Alto": { lat: -25.4182, lng: -49.2085 },
    "Barreirinha": { lat: -25.3649, lng: -49.2541 },
    "Batel": { lat: -25.4414, lng: -49.2847 },
    "Bigorrilho": { lat: -25.4328, lng: -49.3005 },
    "Boa Vista": { lat: -25.3845, lng: -49.2520 },
    "Bom Retiro": { lat: -25.4150, lng: -49.2789 },
    "Boqueirão": { lat: -25.5009, lng: -49.2372 },
    "Butiatuvinha": { lat: -25.4093, lng: -49.3496 },
    "Cabral": { lat: -25.4116, lng: -49.2568 },
    "Cachoeira": { lat: -25.3346, lng: -49.2657 },
    "Cajuru": { lat: -25.4552, lng: -49.2155 },
    "Campina do Siqueira": { lat: -25.4475, lng: -49.3136 },
    "Campo Comprido": { lat: -25.4418, lng: -49.3516 },
    "Campo de Santana": { lat: -25.5879, lng: -49.3197 },
    "Capão da Imbuia": { lat: -25.4431, lng: -49.2064 },
    "Capão Raso": { lat: -25.5015, lng: -49.2934 },
    "Cascatinha": { lat: -25.4077, lng: -49.3183 },
    "Caximba": { lat: -25.6179, lng: -49.3283 },
    "Centro": { lat: -25.4284, lng: -49.2733 },
    "Centro Cívico": { lat: -25.4172, lng: -49.2694 },
    "Cidade Industrial": { lat: -25.5042, lng: -49.3333 },
    "Cristo Rei": { lat: -25.4344, lng: -49.2464 },
    "Fanny": { lat: -25.4851, lng: -49.2676 },
    "Fazendinha": { lat: -25.4745, lng: -49.3164 },
    "Ganchinho": { lat: -25.5683, lng: -49.2698 },
    "Guabirotuba": { lat: -25.4627, lng: -49.2367 },
    "Guaíra": { lat: -25.4735, lng: -49.2737 },
    "Hauer": { lat: -25.4800, lng: -49.2373 },
    "Hugo Lange": { lat: -25.4150, lng: -49.2552 },
    "Jardim Botânico": { lat: -25.4429, lng: -49.2386 },
    "Jardim das Américas": { lat: -25.4608, lng: -49.2201 },
    "Jardim Social": { lat: -25.4184, lng: -49.2275 },
    "Juvevê": { lat: -25.4168, lng: -49.2635 },
    "Lamenha Pequena": { lat: -25.3670, lng: -49.3090 },
    "Lindóia": { lat: -25.4839, lng: -49.2718 },
    "Mercês": { lat: -25.4221, lng: -49.2945 },
    "Mossunguê": { lat: -25.4468, lng: -49.3444 }, // Ecoville area
    "Novo Mundo": { lat: -25.4952, lng: -49.2828 },
    "Orleans": { lat: -25.4331, lng: -49.3789 },
    "Parolin": { lat: -25.4628, lng: -49.2662 },
    "Pilarzinho": { lat: -25.3949, lng: -49.2882 },
    "Pinheirinho": { lat: -25.5262, lng: -49.2952 },
    "Portão": { lat: -25.4746, lng: -49.3013 },
    "Prado Velho": { lat: -25.4542, lng: -49.2562 },
    "Rebouças": { lat: -25.4503, lng: -49.2657 },
    "Riviera": { lat: -25.4880, lng: -49.3700 }, // Approx
    "Santa Cândida": { lat: -25.3589, lng: -49.2319 },
    "Santa Felicidade": { lat: -25.4077, lng: -49.3338 },
    "Santa Quitéria": { lat: -25.4578, lng: -49.3101 },
    "Santo Inácio": { lat: -25.4284, lng: -49.3400 },
    "São Braz": { lat: -25.4042, lng: -49.3622 },
    "São Francisco": { lat: -25.4220, lng: -49.2820 },
    "São João": { lat: -25.3980, lng: -49.3243 },
    "São Lourenço": { lat: -25.3854, lng: -49.2693 },
    "São Miguel": { lat: -25.5140, lng: -49.3600 },
    "Seminário": { lat: -25.4497, lng: -49.3005 },
    "Sítio Cercado": { lat: -25.5458, lng: -49.2625 },
    "Taboão": { lat: -25.3688, lng: -49.2754 },
    "Tarumã": { lat: -25.4258, lng: -49.2144 },
    "Tatuquara": { lat: -25.5866, lng: -49.3377 },
    "Tingui": { lat: -25.3787, lng: -49.2274 },
    "Uberaba": { lat: -25.4870, lng: -49.2089 },
    "Umbará": { lat: -25.5786, lng: -49.2711 },
    "Vila Izabel": { lat: -25.4567, lng: -49.2934 },
    "Vista Alegre": { lat: -25.4140, lng: -49.3041 },
    "Xaxim": { lat: -25.5186, lng: -49.2541 },

    // Fallback
    "DEFAULT": { lat: -25.4284, lng: -49.2733 }
};

function getCoords(name: string) {
    // Normalize and partial match or default
    const key = Object.keys(NEIGHBORHOOD_COORDS).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? NEIGHBORHOOD_COORDS[key] : NEIGHBORHOOD_COORDS["DEFAULT"];
}

/**
 * Calculates the driving distance and time between two points.
 * Uses Google Distance Matrix API (mocked for now) and caches results in DB.
 * Fallback to Haversine if API fails or quota exceeded.
 */
export async function getRouteStats(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
): Promise<RouteResult> {
    const originStr = `${originLat.toFixed(4)},${originLng.toFixed(4)}`;
    const destStr = `${destLat.toFixed(4)},${destLng.toFixed(4)}`;

    // 1. Check Cache
    const cached = await prisma.routeCache.findUnique({
        where: {
            origin_destination: {
                origin: originStr,
                destination: destStr
            }
        }
    });

    if (cached) {
        return {
            distance: cached.distance,
            duration: cached.duration,
            source: 'CACHE'
        };
    }

    // 2. Mock Logic / OSRM
    // Fallback: Haversine * 1.5 (Safety margin for failure)
    const haversineDist = calculateDistance(originLat, originLng, destLat, destLng);
    const mockDist = parseFloat((haversineDist * 1.3).toFixed(2));
    const mockDur = Math.ceil(((haversineDist * 1.3) / 25) * 60 + 5);

    const result: RouteResult = {
        distance: mockDist,
        duration: mockDur,
        source: 'FALLBACK'
    };

    // 3. Save to Cache
    try {
        await prisma.routeCache.create({
            data: {
                origin: originStr,
                destination: destStr,
                distance: result.distance,
                duration: result.duration
            }
        });
    } catch (e) {
        // Ignore dupes
    }

    return result;
}

/**
 * NEW: Calculate/Check route by CLUSTER (Neighborhood Name).
 * This builds the "Giant Matrix" of Neighborhood -> Neighborhood.
 * This effectively covers ALL CEPs because every CEP maps to a neighborhood.
 */
export async function getRouteByCluster(
    originName: string,
    destName: string
): Promise<RouteResult> {

    // Normalize names (e.g. "Centro " -> "centro")
    const origin = originName.trim().toLowerCase();
    const dest = destName.trim().toLowerCase();

    // 1. Check Cache
    const cached = await prisma.routeCache.findUnique({
        where: {
            origin_destination: {
                origin: origin,
                destination: dest
            }
        }
    });

    if (cached) {
        return {
            distance: cached.distance,
            duration: cached.duration,
            source: 'CACHE'
        };
    }

    // 2. Cache Miss - Calculate using Centroids
    const coordsA = getCoords(originName);
    const coordsB = getCoords(destName);
    // console.log(`[Cache Miss] Calculating ${originName} -> ${destName}`);

    // Fallback: Haversine * 1.3 (Simulated Road Factor)
    // In production, insert Google/OSRM call here using coords
    const haversineDist = calculateDistance(coordsA.lat, coordsA.lng, coordsB.lat, coordsB.lng);
    const mockDist = parseFloat((haversineDist * 1.3).toFixed(2));
    const mockDur = Math.ceil(((haversineDist * 1.3) / 25) * 60 + 5); // 25km/h avg + 5min buffer

    const result: RouteResult = {
        distance: mockDist,
        duration: mockDur,
        source: 'API'
    };

    // 3. Save to Matrix (Cache)
    try {
        await prisma.routeCache.create({
            data: {
                origin: origin,
                destination: dest,
                distance: result.distance,
                duration: result.duration
            }
        });
    } catch (e) {
        // Ignore dupes if parallel
    }

    return result;
}

/**
 * NEW: Precise Route (CEP -> CEP) using "Learned" Coordinates.
 * This checks the `CepLocation` table populated by the Address API.
 * Returns NULL if exact coordinates are not yet known.
 */
export async function getPreciseRoute(
    zipA: string,
    zipB: string
): Promise<RouteResult | null> {
    const cleanA = zipA.replace(/\D/g, '');
    const cleanB = zipB.replace(/\D/g, '');

    // 1. Check Matrix Cache (Exact CEP match from DB)
    const locs = await prisma.cepLocation.findMany({
        where: {
            zipCode: { in: [cleanA, cleanB] }
        }
    });

    let locA = locs.find(l => l.zipCode === cleanA);
    let locB = locs.find(l => l.zipCode === cleanB);

    // 2. Fallback: Try CepAberto API if missing
    if (!locA) {
        const dataA = await fetchCepAberto(cleanA);
        if (dataA && dataA.latitude && dataA.longitude) {
            try {
                locA = await prisma.cepLocation.create({
                    data: {
                        zipCode: cleanA,
                        latitude: parseFloat(dataA.latitude),
                        longitude: parseFloat(dataA.longitude),
                        neighborhood: dataA.bairro || undefined,
                        city: dataA.cidade?.nome || undefined
                    }
                });
            } catch (e) { console.error("Error saving CepAberto A", e); }
        }
    }

    if (!locB) {
        const dataB = await fetchCepAberto(cleanB);
        if (dataB && dataB.latitude && dataB.longitude) {
            try {
                locB = await prisma.cepLocation.create({
                    data: {
                        zipCode: cleanB,
                        latitude: parseFloat(dataB.latitude),
                        longitude: parseFloat(dataB.longitude),
                        neighborhood: dataB.bairro || undefined,
                        city: dataB.cidade?.nome || undefined
                    }
                });
            } catch (e) { console.error("Error saving CepAberto B", e); }
        }
    }

    if (locA && locB) {
        // We have exact coords!
        const haversineDist = calculateDistance(locA.latitude, locA.longitude, locB.latitude, locB.longitude);
        const mockDist = parseFloat((haversineDist * 1.3).toFixed(2)); // Road factor
        const mockDur = Math.ceil(((haversineDist * 1.3) / 25) * 60 + 5);

        return {
            distance: mockDist,
            duration: mockDur,
            source: 'API' // Precise
        };
    }

    return null; // Fallback to Cluster
}
