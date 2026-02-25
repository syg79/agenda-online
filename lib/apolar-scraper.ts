import { chromium, type Page, type Browser } from 'playwright-core';

// Reuse mappings from tadabase.ts (identical to Python constants.py)
const LOJAS_MAP: Record<string, string> = {
    "Afonso Pena": "A Pena",
    "Almirante Tamandaré": "A Tamandare",
    "Água Verde": "A Verde",
    "Ahú": "Ahu",
    "Alphaville": "Alphaville",
    "Alto da XV": "Alto da XV",
    "Bairro Alto": "J Social",
    "Boa Vista": "B Vista",
    "Bacacheri": "Bacacheri",
    "Batel": "Batel",
    "Boqueirão": "Boqueirao",
    "Centro Cívico": "C Civico",
    "Campo Comprido": "C Comprido",
    "Capão Raso": "C Raso",
    "Sítio Cercado": "C Raso",
    "Capão Da Imbuia": "C Imbuia",
    "Centro": "Centro",
    "Champagnat": "Champagnat",
    "Colombo": "Colombo",
    "Colombo Rodovia Da Uva": "Colombo",
    "Real Estate": "Concept",
    "Fazenda Rio Grande": "F Rio Grande",
    "Fanny": "Kennedy",
    "Fazendinha": "Fazendinha",
    "Hauer": "Hauer",
    "Jardim das Américas": "J Americas",
    "Jardim Botânico": "J Botanico",
    "Jardim Social": "J Social",
    "Juvevê": "Juveve",
    "Kennedy": "Kennedy",
    "Mercês": "Merces",
    "Pilarzinho": "Pilarzinho",
    "Pinhais": "Pinhais",
    "Rebouças": "Rebouças",
    "Santa Cândida": "S Candida",
    "Santa Felicidade": "S Felicidade",
    "Santa Quitéria": "S Quiteria",
    "Seminário": "Seminario",
    "São José dos Pinhais": "SJPinhais",
    "Uberaba": "J Americas",
    "Xaxim": "Xaxim",
    "Novo Mundo": "Novo Mundo"
};

const TIPO_IMOVEL_MAP: Record<string, string> = {
    "Apartamento": "Ap",
    "Loft": "Ap",
    "Garden": "Ap",
    "Flat": "Ap",
    "Duplex": "Ap",
    "Triplex": "Ap",
    "Casa": "Casa",
    "Casa Mista": "Casa",
    "Sobrado": "Sobrado",
    "Área": "Terreno",
    "Terreno": "Terreno",
    "Garagem": "Comercial",
    "Sobreloja": "Comercial",
    "Loja": "Comercial",
    "Sala": "Comercial",
    "Conjunto": "Comercial",
    "Chácara": "Chácara",
    "Fazenda": "Chácara",
    "Sítio": "Chácara",
    "Barracão": "Barracão",
    "Prédio": "Predio",
    "Hotel": "Predio",
    "Kitnet": "Kitnet",
    "Studio": "Kitnet",
    "Cobertura": "Cob"
};

export interface PropertyData {
    ref: string;
    address: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    propertyType: string | null;
    area: number | null;
    bedrooms: number | null;
    parkingSpaces: number | null;
    brokerName: string | null;
    storeName: string | null;
    price: number | null;
    latitude: number | null;
    longitude: number | null;
    building: string | null;
    description: string | null;
    situation: string | null;
}

// Check if ApolarNet is in maintenance (02:00-06:00 BRT)
export function isMaintenanceWindow(): boolean {
    const now = new Date();
    const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hour = brTime.getHours();
    return hour >= 2 && hour < 6;
}

// Validate REF format (6 digits)
export function validateRef(ref: string): boolean {
    return /^\d{6}$/.test(ref);
}

// Google Geocoding enrichment
async function geocodeAddress(rawAddress: string): Promise<{
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    lat: number | null;
    lng: number | null;
}> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !rawAddress) {
        return {
            address: rawAddress,
            neighborhood: 'Curitiba',
            city: 'Curitiba',
            state: 'PR',
            zipCode: '80000-000',
            lat: null,
            lng: null
        };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(rawAddress)}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'OK' || !data.results?.[0]) {
            return { address: rawAddress, neighborhood: 'Curitiba', city: 'Curitiba', state: 'PR', zipCode: '80000-000', lat: null, lng: null };
        }

        const result = data.results[0];
        const components = result.address_components || [];
        const geo = result.geometry?.location;

        let street = '';
        let number = '';
        let neighborhood = '';
        let city = '';
        let state = '';
        let zipCode = '';

        for (const comp of components) {
            const types: string[] = comp.types || [];
            if (types.includes('route')) street = comp.long_name;
            else if (types.includes('street_number')) number = comp.long_name;
            else if (types.includes('sublocality') || types.includes('sublocality_level_1')) neighborhood = comp.long_name;
            else if (types.includes('administrative_area_level_2')) city = comp.long_name;
            else if (types.includes('administrative_area_level_1')) state = comp.short_name;
            else if (types.includes('postal_code')) zipCode = comp.long_name;
        }

        return {
            address: `${street}, ${number}`.trim().replace(/,$/, ''),
            neighborhood: neighborhood || 'Curitiba',
            city: city || 'Curitiba',
            state: state || 'PR',
            zipCode: zipCode || '80000-000',
            lat: geo?.lat ?? null,
            lng: geo?.lng ?? null
        };
    } catch (error) {
        console.error('[Geocode] Error:', error);
        return { address: rawAddress, neighborhood: 'Curitiba', city: 'Curitiba', state: 'PR', zipCode: '80000-000', lat: null, lng: null };
    }
}

// Safe text extraction helper
async function getTextSafe(page: Page, selector: string): Promise<string> {
    try {
        const el = page.locator(selector).first();
        if (await el.count() === 0) return '';
        return (await el.innerText()).trim();
    } catch {
        return '';
    }
}

// Extract popup field by label (mirrors Python's extrair_valor_por_label)
async function extractByLabel(page: Page, labelText: string): Promise<string> {
    try {
        const label = page.locator(`label.control-label:text("${labelText}")`).first();
        if (await label.count() === 0) return '';

        const value = await label.evaluate((el: HTMLElement) => {
            const parent = el.parentElement;
            if (!parent) return '';
            const labels = parent.querySelectorAll('label.control-label[style*="font-weight:normal"]');
            return labels.length > 0 ? (labels[0] as HTMLElement).innerText : '';
        });

        return (value || '').trim();
    } catch {
        return '';
    }
}

// Parse area string to float (mirrors Python logic)
function parseArea(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

// Parse price string to number
function parsePrice(raw: string): number | null {
    const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

// Parse bedrooms/parking to int
function parseIntSafe(raw: string): number | null {
    const val = parseInt(raw, 10);
    return isNaN(val) ? null : val;
}

// Main scraping function - port of Python's processar_referencia()
export async function scrapeProperty(ref: string): Promise<PropertyData> {
    const browserlessUrl = process.env.BROWSERLESS_URL;
    if (!browserlessUrl) throw new Error('BROWSERLESS_URL not configured');

    const apolarUser = process.env.APOLAR_USER;
    const apolarPass = process.env.APOLAR_PASS;
    if (!apolarUser || !apolarPass) throw new Error('APOLAR_USER/APOLAR_PASS not configured');

    console.log(`[Scraper] Starting scrape for REF: ${ref}`);
    let browser: Browser | null = null;

    try {
        // Connect to remote Browserless instance
        browser = await chromium.connectOverCDP(browserlessUrl);
        const context = await browser.newContext();
        const page = await context.newPage();

        // 1. Login to ApolarNet (mirrors Python L302-312)
        console.log('[Scraper] Logging into apolar.net...');
        await page.goto('https://apolar.net', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#Login', { timeout: 10000 });
        await page.fill('#Login', apolarUser);
        await page.fill('#Senha', apolarPass);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        console.log('[Scraper] Login successful');

        // 2. Navigate to ERP > Análise Carteira (mirrors Python L320-327)
        console.log('[Scraper] Navigating to Análise Carteira...');
        await page.locator('a.sidebar-itens:has-text("ERP")').click();
        await page.waitForTimeout(1000);
        await page.locator('a.sidebar-itens[href="/AnaliseCarteira/"]').click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 3. Search by REF (mirrors Python L330-333)
        console.log(`[Scraper] Searching REF: ${ref}...`);
        await page.fill('input#txtReferencia', ref);
        await page.waitForTimeout(500);
        await page.click('a#btnPesquisar');
        await page.waitForLoadState('networkidle');

        // 4. Check if found (mirrors Python L339-346)
        const notFound = page.locator('text=Nenhum imóvel encontrado');
        if (await notFound.count() > 0) {
            throw new Error(`Imóvel com referência ${ref} não encontrado no ApolarNet`);
        }

        // 5. Extract main data from table row (mirrors Python L349-368)
        const row = page.locator(`tr:has-text("${ref}")`);
        if (await row.count() === 0) {
            throw new Error('Linha do imóvel não encontrada na tabela');
        }

        const rawAddress = (await row.locator('td').nth(1).innerText()).trim();
        const rawBedrooms = (await row.locator('td').nth(2).innerText()).trim();
        const rawType = (await row.locator('td').nth(3).innerText()).trim();
        const rawComplement = (await row.locator('td').nth(4).innerText()).trim();
        const rawArea = (await row.locator('td').nth(6).innerText()).trim();
        const rawParking = (await row.locator('td').nth(7).innerText()).trim();
        const rawPrice = (await row.locator('td').nth(8).innerText()).trim();
        const rawSituation = (await row.locator('td').nth(9).innerText()).trim();

        console.log('[Scraper] Main data extracted');

        // 6. Open popup for additional data (mirrors Python L375-427)
        console.log('[Scraper] Opening popup...');
        await page.locator('#btnEditar').click({ timeout: 10000 });
        await page.waitForSelector('text=Loja Angariadora', { timeout: 15000 });

        const rawStore = await extractByLabel(page, 'Loja Angariadora');
        const rawBuilding = await getTextSafe(page, '//label[contains(text(), "Edifício")]/following-sibling::label[1]');

        // Extract description and internal notes (last two text-left labels)
        const labelsCount = await page.locator('label.text-left').count();
        let rawDescription = '';
        let rawNotes = '';
        if (labelsCount >= 2) {
            rawDescription = (await page.locator('label.text-left').nth(labelsCount - 2).innerText()).trim();
            rawNotes = (await page.locator('label.text-left').nth(labelsCount - 1).innerText()).trim();
        }

        // Close popup
        await page.evaluate(() => {
            const btn = document.querySelector('#btnFecharModalConfirm') as HTMLElement;
            btn?.click();
        });

        console.log('[Scraper] Popup data extracted');

        // 7. Enrich address with Google Geocoding
        const fullAddress = rawComplement
            ? `${rawAddress}, ${rawComplement}, Curitiba, PR`
            : `${rawAddress}, Curitiba, PR`;

        const geo = await geocodeAddress(fullAddress);

        // 8. Build result
        const storeMapped = LOJAS_MAP[rawStore] || rawStore;
        const typeMapped = TIPO_IMOVEL_MAP[rawType] || rawType;

        const result: PropertyData = {
            ref,
            address: geo.address || rawAddress,
            neighborhood: geo.neighborhood,
            city: geo.city,
            state: geo.state,
            zipCode: geo.zipCode,
            propertyType: typeMapped,
            area: parseArea(rawArea),
            bedrooms: parseIntSafe(rawBedrooms),
            parkingSpaces: parseIntSafe(rawParking),
            brokerName: null, // Populated separately via contact data
            storeName: storeMapped,
            price: parsePrice(rawPrice),
            latitude: geo.lat,
            longitude: geo.lng,
            building: rawBuilding || null,
            description: rawDescription || rawNotes || null,
            situation: rawSituation || null
        };

        console.log(`[Scraper] Complete for REF ${ref}:`, JSON.stringify(result, null, 2));
        return result;

    } finally {
        if (browser) {
            try { await browser.close(); } catch { /* ignore */ }
        }
    }
}
