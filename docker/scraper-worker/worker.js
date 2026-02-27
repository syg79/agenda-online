/**
 * Scraper Worker — runs on Oracle VM alongside Browserless
 * Receives scrape requests, executes them, updates ScrapeJob in Supabase
 *
 * Usage: node worker.js
 * Env: DATABASE_URL, APOLAR_USER, APOLAR_PASS, BROWSERLESS_WS (default ws://localhost:3033)
 */

const express = require('express');
const { chromium } = require('playwright-core');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Direct PostgreSQL connection to Supabase
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Auth token to prevent unauthorized access
const WORKER_TOKEN = process.env.WORKER_TOKEN || 'vitrine2026';

// Browserless WebSocket URL (local on same VM)
const BROWSERLESS_WS = process.env.BROWSERLESS_WS || 'ws://localhost:3033?token=vitrine2026';

// Apolar credentials
const APOLAR_USER = process.env.APOLAR_USER;
const APOLAR_PASS = process.env.APOLAR_PASS;

// Store/type mappings (same as TypeScript version)
const LOJAS_MAP = {
    "Afonso Pena": "A Pena", "Almirante Tamandaré": "A Tamandare",
    "Água Verde": "A Verde", "Ahú": "Ahu", "Alphaville": "Alphaville",
    "Alto da XV": "Alto da XV", "Bairro Alto": "J Social", "Boa Vista": "B Vista",
    "Bacacheri": "Bacacheri", "Batel": "Batel", "Boqueirão": "Boqueirao",
    "Centro Cívico": "C Civico", "Campo Comprido": "C Comprido",
    "Capão Raso": "C Raso", "Sítio Cercado": "C Raso", "Capão Da Imbuia": "C Imbuia",
    "Centro": "Centro", "Champagnat": "Champagnat", "Colombo": "Colombo",
    "Colombo Rodovia Da Uva": "Colombo", "Real Estate": "Concept",
    "Fazenda Rio Grande": "F Rio Grande", "Fanny": "Kennedy",
    "Fazendinha": "Fazendinha", "Hauer": "Hauer", "Jardim das Américas": "J Americas",
    "Jardim Botânico": "J Botanico", "Jardim Social": "J Social", "Juvevê": "Juveve",
    "Kennedy": "Kennedy", "Mercês": "Merces", "Pilarzinho": "Pilarzinho",
    "Pinhais": "Pinhais", "Rebouças": "Rebouças", "Santa Cândida": "S Candida",
    "Santa Felicidade": "S Felicidade", "Santa Quitéria": "S Quiteria",
    "Seminário": "Seminario", "São José dos Pinhais": "SJPinhais",
    "Uberaba": "J Americas", "Xaxim": "Xaxim", "Novo Mundo": "Novo Mundo"
};

const TIPO_MAP = {
    "Apartamento": "Ap", "Loft": "Ap", "Garden": "Ap", "Flat": "Ap",
    "Duplex": "Ap", "Triplex": "Ap", "Casa": "Casa", "Casa Mista": "Casa",
    "Sobrado": "Sobrado", "Área": "Terreno", "Terreno": "Terreno",
    "Garagem": "Comercial", "Sobreloja": "Comercial", "Loja": "Comercial",
    "Sala": "Comercial", "Conjunto": "Comercial", "Chácara": "Chácara",
    "Fazenda": "Chácara", "Sítio": "Chácara", "Barracão": "Barracão",
    "Prédio": "Predio", "Hotel": "Predio", "Kitnet": "Kitnet",
    "Studio": "Kitnet", "Cobertura": "Cob"
};

// Update ScrapeJob in Supabase
async function updateJob(jobId, data) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const [key, val] of Object.entries(data)) {
        const col = key === 'updatedAt' ? '"updatedAt"' : `"${key}"`;
        fields.push(`${col} = $${i}`);
        values.push(val);
        i++;
    }
    values.push(jobId);
    await pool.query(`UPDATE "ScrapeJob" SET ${fields.join(', ')} WHERE id = $${i}`, values);
}

async function progress(jobId, step, percent) {
    console.log(`  [${percent}%] ${step}`);
    await updateJob(jobId, { status: 'processing', step, percent, updatedAt: new Date() });
}

// Safe text extraction helpers
async function getTextSafe(locator) {
    try {
        if (await locator.count() === 0) return '';
        return (await locator.innerText()).trim();
    } catch { return ''; }
}

async function extractByLabel(page, labelText) {
    try {
        const label = page.locator(`label.control-label:text("${labelText}")`).first();
        if (await label.count() === 0) return '';
        const valor = await label.evaluate(el => {
            const parent = el.parentElement;
            const labels = parent.querySelectorAll('label.control-label[style*="font-weight:normal"]');
            return labels.length > 0 ? labels[0].innerText : '';
        });
        return (valor || '').trim();
    } catch { return ''; }
}

function parseArea(raw) {
    const val = parseFloat(raw.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(val) ? null : val;
}

function parsePrice(raw) {
    const val = parseFloat(raw.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(val) ? null : val;
}

function parseInt2(raw) {
    const val = parseInt(raw, 10);
    return isNaN(val) ? null : val;
}

// Google Geocoding
async function geocodeAddress(rawAddress) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey || !rawAddress) {
        return { address: rawAddress, neighborhood: 'Curitiba', city: 'Curitiba', state: 'PR', zipCode: '80000-000', lat: null, lng: null };
    }
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(rawAddress)}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== 'OK' || !data.results?.[0]) {
            return { address: rawAddress, neighborhood: 'Curitiba', city: 'Curitiba', state: 'PR', zipCode: '80000-000', lat: null, lng: null };
        }
        const result = data.results[0];
        const comps = result.address_components || [];
        const geo = result.geometry?.location;
        let street = '', number = '', neighborhood = '', city = '', state = '', zipCode = '';
        for (const c of comps) {
            const t = c.types || [];
            if (t.includes('route')) street = c.long_name;
            else if (t.includes('street_number')) number = c.long_name;
            else if (t.includes('sublocality') || t.includes('sublocality_level_1')) neighborhood = c.long_name;
            else if (t.includes('administrative_area_level_2')) city = c.long_name;
            else if (t.includes('administrative_area_level_1')) state = c.short_name;
            else if (t.includes('postal_code')) zipCode = c.long_name;
        }
        return {
            address: `${street}, ${number}`.trim().replace(/,$/, ''),
            neighborhood: neighborhood || 'Curitiba', city: city || 'Curitiba', state: state || 'PR',
            zipCode: zipCode || '80000-000', lat: geo?.lat ?? null, lng: geo?.lng ?? null
        };
    } catch { return { address: rawAddress, neighborhood: 'Curitiba', city: 'Curitiba', state: 'PR', zipCode: '80000-000', lat: null, lng: null }; }
}

// Main scrape function
async function executeScrape(jobId, ref) {
    let browser = null;
    try {
        await progress(jobId, 'Conectando ao navegador...', 10);
        browser = await chromium.connectOverCDP(BROWSERLESS_WS);
        const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
        const page = await context.newPage();

        // Login
        await progress(jobId, 'Conectando ao ApolarNet...', 15);
        await page.goto('https://apolar.net', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#Login', { timeout: 10000 });
        await page.fill('#Login', APOLAR_USER);
        await page.fill('#Senha', APOLAR_PASS);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await progress(jobId, 'Login realizado', 20);

        // Navigate
        await progress(jobId, 'Navegando para Análise Carteira...', 30);
        try {
            await page.locator('a.sidebar-itens:has-text("ERP")').click({ force: true, timeout: 5000 });
            await page.waitForTimeout(1500);
            await page.locator('a.sidebar-itens[href="/AnaliseCarteira/"]').click({ force: true, timeout: 5000 });
        } catch {
            await page.goto('https://apolar.net/AnaliseCarteira/', { waitUntil: 'networkidle', timeout: 30000 });
        }
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search
        await progress(jobId, `Buscando referência ${ref}...`, 40);
        await page.fill('input#txtReferencia', ref);
        await page.waitForTimeout(500);
        await page.click('a#btnPesquisar');
        await page.waitForLoadState('networkidle');

        const notFound = page.locator('text=Nenhum imóvel encontrado');
        if (await notFound.count() > 0) {
            throw new Error('Imóvel não encontrado. Confira se a referência está correta.');
        }

        // Extract table data
        const row = page.locator(`tr:has-text("${ref}")`);
        if (await row.count() === 0) throw new Error('Imóvel não encontrado. Confira se a referência está correta.');

        const rawAddress = (await row.locator('td').nth(1).innerText()).trim();
        const rawBedrooms = (await row.locator('td').nth(2).innerText()).trim();
        const rawType = (await row.locator('td').nth(3).innerText()).trim();
        const rawComplement = (await row.locator('td').nth(4).innerText()).trim();
        const rawArea = (await row.locator('td').nth(6).innerText()).trim();
        const rawParking = (await row.locator('td').nth(7).innerText()).trim();
        const rawPrice = (await row.locator('td').nth(8).innerText()).trim();
        const rawSituation = (await row.locator('td').nth(9).innerText()).trim();
        await progress(jobId, 'Dados principais extraídos', 50);

        // Popup
        await progress(jobId, 'Abrindo popup de detalhes...', 55);
        await page.locator('#btnEditar').click({ timeout: 10000 });
        await page.waitForSelector('text=Loja Angariadora', { timeout: 15000 });

        const rawStore = await extractByLabel(page, 'Loja Angariadora');
        const rawBuilding = await getTextSafe(page.locator('//label[contains(text(), "Edifício")]/following-sibling::label[1]'));
        const rawListingDate = await getTextSafe(page.locator('//label[contains(text(), "Data Angariação")]/../../div[4]/label'));
        const rawExpiryDate = await getTextSafe(page.locator('//label[contains(text(), "Data Vencimento")]/../../div[4]/label'));
        const rawPopupPrice = await getTextSafe(page.locator('//label[normalize-space(text())="Valor:"]/following::label[contains(text(), "R$")]'));

        const labelsCount = await page.locator('label.text-left').count();
        let rawDescription = '', rawNotes = '';
        if (labelsCount >= 2) {
            rawDescription = (await page.locator('label.text-left').nth(labelsCount - 2).innerText()).trim();
            rawNotes = (await page.locator('label.text-left').nth(labelsCount - 1).innerText()).trim();
        }

        await page.evaluate(() => document.querySelector('#btnFecharModalConfirm')?.click());
        await progress(jobId, 'Popup processado', 65);

        // Geocoding
        await progress(jobId, 'Enriquecendo endereço...', 75);
        const fullAddr = rawComplement ? `${rawAddress}, ${rawComplement}, Curitiba, PR` : `${rawAddress}, Curitiba, PR`;
        const geo = await geocodeAddress(fullAddr);

        const storeMapped = LOJAS_MAP[rawStore] || rawStore;
        const typeMapped = TIPO_MAP[rawType] || rawType;

        await progress(jobId, 'Salvando dados...', 90);

        const result = {
            ref, address: geo.address || rawAddress, neighborhood: geo.neighborhood,
            city: geo.city, state: geo.state, zipCode: geo.zipCode,
            propertyType: typeMapped, area: parseArea(rawArea), bedrooms: parseInt2(rawBedrooms),
            parkingSpaces: parseInt2(rawParking), storeName: storeMapped, price: parsePrice(rawPrice),
            latitude: geo.lat, longitude: geo.lng, building: rawBuilding || null,
            complement: rawComplement || null,
            description: rawDescription || null, situation: rawSituation || null,
            listingDate: rawListingDate || null, expiryDate: rawExpiryDate || null,
            popupPrice: rawPopupPrice || null, internalNotes: rawNotes || null
        };

        // Save to Property table (upsert)
        await pool.query(`
            INSERT INTO "Property" (id, ref, address, neighborhood, city, state, "zipCode", "propertyType", area, bedrooms, "parkingSpaces", "brokerName", "storeName", price, latitude, longitude, building, complement, description, situation, "rawData", "scrapedAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, NOW(), NOW())
            ON CONFLICT (ref) DO UPDATE SET
                address = $2, neighborhood = $3, city = $4, state = $5, "zipCode" = $6, "propertyType" = $7,
                area = $8, bedrooms = $9, "parkingSpaces" = $10, "storeName" = $11, price = $12,
                latitude = $13, longitude = $14, building = $15, complement = $16, description = $17, situation = $18,
                "rawData" = $19::jsonb, "updatedAt" = NOW()
        `, [ref, result.address, result.neighborhood, result.city, result.state, result.zipCode,
            result.propertyType, result.area, result.bedrooms, result.parkingSpaces, result.storeName,
            result.price, result.latitude, result.longitude, result.building, result.complement,
            result.description, result.situation, JSON.stringify(result)]);

        // Complete
        await updateJob(jobId, { status: 'complete', percent: 100, step: 'Concluído!', result: JSON.stringify(result), updatedAt: new Date() });
        console.log(`✅ REF ${ref} concluído`);

    } catch (err) {
        console.error(`❌ REF ${ref} erro:`, err.message);
        await updateJob(jobId, { status: 'error', step: err.message, error: err.message, updatedAt: new Date() });
    } finally {
        if (browser) try { await browser.close(); } catch { }
    }
}

// Auth middleware
function auth(req, res, next) {
    const token = req.headers['x-worker-token'] || req.query.token;
    if (token !== WORKER_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.post('/scrape', auth, (req, res) => {
    const { jobId, ref } = req.body;
    if (!jobId || !ref) return res.status(400).json({ error: 'jobId and ref required' });

    // Fire and forget — respond immediately, execute in background
    res.json({ status: 'accepted', jobId });
    executeScrape(jobId, ref).catch(err => console.error('Unhandled scrape error:', err));
});

// Start
const PORT = process.env.WORKER_PORT || 3034;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Scraper Worker listening on port ${PORT}`);
    console.log(`   Browserless: ${BROWSERLESS_WS}`);
    console.log(`   DB: ${process.env.DATABASE_URL ? '✅ connected' : '❌ missing'}`);
});
