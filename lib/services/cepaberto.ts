
/**
 * CepAberto API V3 Client
 * Documentation: https://cepaberto.com/api_v3
 * 
 * Usage:
 * Requires CEPABERTO_TOKEN in .env
 */

export interface CepAbertoData {
    cep: string;
    logradouro?: string;
    bairro?: string;
    cidade?: { nome: string };
    estado?: { sigla: string };
    latitude?: string;
    longitude?: string;
    altitude?: string;
}

export async function fetchCepAberto(cep: string): Promise<CepAbertoData | null> {
    const token = process.env.CEPABERTO_TOKEN;
    if (!token) {
        // Console log only once to avoid spam, or debug only
        // console.warn("CEPABERTO_TOKEN not found. Skipping API call.");
        return null;
    }

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return null;

    const url = `https://www.cepaberto.com/api/v3/cep?cep=${cleanCep}`;

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Token token=${token}`
            },
            next: { revalidate: 86400 } // Cache for 24h
        });

        if (!res.ok) {
            console.error(`CepAberto API Error: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();

        // Check if empty object (common in some APIs if not found)
        if (!data || Object.keys(data).length === 0) {
            return null;
        }

        return data as CepAbertoData;

    } catch (error) {
        console.error("CepAberto Fetch Error:", error);
        return null;
    }
}
