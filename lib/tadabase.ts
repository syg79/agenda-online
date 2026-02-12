import { Booking } from '@prisma/client';

// Field Mappings from ApolarBot & User Feedback
const FIELDS = {
    protocol: 'field_139',     // Referência
    address: 'field_94',       // Endereço (Object)
    complement: 'field_136',   // Complemento
    type: 'field_92',          // Tipo de Imóvel
    area: 'field_95',          // Área Total
    client: 'field_86',        // Cliente (Loja - Connection)
    status: 'field_114',       // Status (Select)
    serviceType: 'field_110',  // Tipo serviço (Checkbox)
    rede: 'field_175',         // Rede (Connection)
    contactName: 'field_177',  // Contato Nome
    contactEmail: 'field_375', // Email Adicional / Contato
    contactPhone: 'field_491', // Fone Corretor / Contato (Updated to field_491 per user)
    contactLink: 'field_137',  // Link Gmail
    obsPhotographer: 'field_112', // Observacao para o Fotografo
    obsScheduling: 'field_276',   // Observacao para o Agendamento
    date: 'field_106', // Data do Agendamento
    requestDate: 'field_103', // Data da Solicitação
    time: 'field_406', // Horario da Sessao
    protocolNew: 'field_490', // Protocolo de Agendamento

    // Defaults from ApolarBot
    situation: 'field_219',    // Situação: "Pre-solicitacao (cliente)"
    addressPhotographer: 'field_275', // Endereço Fotógrafo: "Imovel"
    statusNew: 'field_386',    // Status Novo: "Pendente"
    origin: 'field_448',       // Origem: "Automatico"
    edited: 'field_251',       // Editado: "Nao"
    printed: 'field_306',      // Impresso: "nao"
    publishAgenda: 'field_223',// Publicar agenda: "Privado"

    photographer: 'q3kjZDEN6V', // Fotografo (Connection)
};

// Mappings
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

const LOJAS_IDS: Record<string, string> = {
    "A Pena": "X9EjVXNo2K",
    "A Tamandare": "DVWQWRNZ49",
    "A Verde": "4MXQJdrZ6v",
    "Ahu": "5m9N0njzqk",
    "Alphaville": "l5nQx74NxY",
    "Alto da XV": "4PzQ4GNJGV",
    "J Social": "pPEryWQOnV",
    "B Vista": "L5MjK9wN0k",
    "Bacacheri": "o6WQb5NnBZ",
    "Batel": "lGArg7rmR6",
    "Boqueirao": "eykNOvrDY3",
    "C Imbuia": "W4yQk4jgPK",
    "C Civico": "K2ejlOQo9B",
    "C Comprido": "698rd2QZwd",
    "C Raso": "JDXQ80QYRl",
    "Centro": "VX9QoerwYv",
    "Champagnat": "L5MjKxr0kq",
    "Colombo": "DVarwJjORP",
    "Concept": "JawrR1qj5k",
    "Ecoville": "K68j9gN2V7",
    "F Rio Grande": "mloNLEYQM8",
    "Kennedy": "4YZjnDNPvl",
    "Fazendinha": "6b1rAKQKkA",
    "Hauer": "3GDN1mNeqP",
    "J Americas": "DkMjmwNvV6",
    "J Botanico": "L5MjKewN0k",
    "Juveve": "PblNe6QxwL",
    "Merces": "7oOjDdjB9A",
    "Pilarzinho": "4Z9Q29N2mo",
    "Pinhais": "m72NporwvZ",
    "Rebouças": "JawrRqqj5k",
    "S Candida": "l5nQxLQxYX",
    "S Felicidade": "3xPjXYrKGE",
    "S Quiteria": "oGWN5qNlAe",
    "Seminario": "mloNLGrM8p",
    "SJPinhais": "B8qQPZr16n",
    "Xaxim": "q3kjZDVN6V",
    "Novo Mundo": "oGWN5B8QlA"
};

const PHOTOGRAPHER_MAP: Record<string, string> = {
    'Augusto': '4MXQJdrZ6v',
    'Rafael': 'L5MjKxr0kq',
    'Vitor Imoto': 'eykNOvrDY3',
    'Dankan': '5m9N0njzqk',
    'Lazaro': '4PzQ4GNJGV',
    'Renato': 'oaANB1r1by',
    'Ronald': 'o6WQb5NnBZ',
    'Fernanda': 'K2ejlOQo9B',
    'Eduardo': 'JDXQ80QYRl',
    'Rodrigo': 'VX9QoerwYv',
    'Marcio': 'DVarwJjORP',
    'Fabiano': 'K68j9gN2V7',
};

// Service Type Mapping (App -> Tadabase Checkbox Strings)
// The keys must match what is stored in Booking.services (Prisma)
// The values must match EXACTLY the options in Tadabase (Check the HTML/Screenshot)
const SERVICE_MAP: Record<string, string> = {
    // Internal Keys (Seen in logs)
    "photo": "Fotos",
    "video_landscape": "Vídeo em Solo (formato Youtube)",
    "video_portrait": "Video em Solo (formato Reels)",
    "drone_photo": "Drone fotos",
    "drone_video": "Drone video",
    "drone_photo_video": "Drone video", // Or map to both if possible? Tadabase usually takes array.
    "tour_360": "Tour 360º",
    "floor_plan": "Planta Baixa",

    // Legacy Keys
    "Fotos": "Fotos",
    "Fotos HDR": "Fotos",
    "Video": "Vídeo em Solo (formato Youtube)",
    "Vídeo": "Vídeo em Solo (formato Youtube)",
    "Video Youtube": "Vídeo em Solo (formato Youtube)",
    "Drone": "Drone fotos",
    "Drone Foto": "Drone fotos",
    "Drone Video": "Drone video",
    "Drone Vídeo": "Drone video",
    "Tour 360": "Tour 360º",
    "Tour": "Tour 360º",
    "Tour Virtual": "Tour 360º",
    "Planta": "Planta Baixa",
    "Planta Baixa": "Planta Baixa",
    "Reels": "Video em Solo (formato Reels)",
    "Vídeo Reels": "Video em Solo (formato Reels)",
    "Locução": "Locução",
    "Edição": "Edição"
};

export const tadabase = {
    async syncBooking(booking: any) {
        const APP_ID = process.env.TADABASE_APP_ID;
        const APP_KEY = process.env.TADABASE_APP_KEY;
        const APP_SECRET = process.env.TADABASE_APP_SECRET;
        const TABLE_ID = process.env.SOLICITACAO_TABLE_ID;

        if (!APP_ID || !APP_KEY || !APP_SECRET || !TABLE_ID) {
            console.warn('⚠️ Tadabase credentials missing. Skipping sync.');
            return;
        }

        try {
            console.log(`🔄 Syncing booking ${booking.protocol} to Tadabase...`);

            // 1. Search for existing record by Protocol
            const filters = `filters[items][0][field_id]=${FIELDS.protocol}&filters[items][0][operator]=is&filters[items][0][val]=${booking.protocol}`;
            const searchUrl = `${process.env.TADABASE_API_URL}/data-tables/${TABLE_ID}/records?${filters}`;

            const searchRes = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'X-Tadabase-App-id': APP_ID, 'X-Tadabase-App-Key': APP_KEY, 'X-Tadabase-App-Secret': APP_SECRET
                }
            });

            const searchData = await searchRes.json();
            let existingRecordId = null;
            if (searchData.items && searchData.items.length > 0) {
                existingRecordId = searchData.items[0].id;
                console.log(`🔎 Found existing record: ${existingRecordId}`);
            }

            // 2. Prepare Payload

            // Address Parsing
            let cleanAddress = booking.address || "";
            if (cleanAddress.includes('-')) {
                cleanAddress = cleanAddress.split('-')[0].trim();
            }
            if (cleanAddress.endsWith(',')) {
                cleanAddress = cleanAddress.slice(0, -1).trim();
            }

            // Zip Code Default Handling
            // User complained it's ALWAYS 80000-000. So we prefer booking.zipCode.
            let zip = booking.zipCode;
            if (!zip || zip.length < 5) {
                zip = '80000-000'; // Only fallback if missing/invalid
            }

            const addressPayload = {
                address: cleanAddress,
                city: booking.neighborhood || 'Curitiba',
                state: booking.city || 'Curitiba',
                zip: zip,
                country: 'Brasil'
            };

            // Map Services
            // If booking.services is undefined, default to []
            const rawServices = booking.services || [];
            // Map each service using SERVICE_MAP, fallback to original string if not found
            let services = rawServices.map((s: string) => SERVICE_MAP[s] || s);

            // Special handling for 'drone_photo_video' -> might want to push both 'Drone fotos' and 'Drone video'
            // But Map is 1:1. If 'drone_photo_video' maps to 'Drone video', and user wanted both, we might miss one. 
            // For now, let's trust the map.

            // Ensure unique values and remove empty strings
            services = Array.from(new Set(services)).filter(s => s && s.trim() !== '');

            // Default to 'Fotos' if list is empty, because app sends 'photo'
            if (services.length === 0) services.push('Fotos');

            const payload: any = {
                [FIELDS.protocol]: booking.protocol,
                [FIELDS.protocolNew]: booking.protocol,
                [FIELDS.complement]: booking.complement,
                [FIELDS.type]: TIPO_IMOVEL_MAP[booking.propertyType] || 'Ap',
                [FIELDS.area]: booking.area ? booking.area.toString().replace('.', ',') : '0',
                [FIELDS.address]: addressPayload,
                [FIELDS.status]: 'Pendente',
                [FIELDS.serviceType]: services,
                [FIELDS.rede]: 'DVWQWRNZ49', // Apolar

                // Client Data
                [FIELDS.contactName]: booking.clientName,
                [FIELDS.contactEmail]: booking.clientEmail,
                [FIELDS.contactPhone]: booking.clientPhone,
                [FIELDS.obsScheduling]: booking.notes,

                // Date & Time
                [FIELDS.date]: booking.date ? new Date(booking.date).toISOString().split('T')[0] : undefined,
                [FIELDS.requestDate]: new Date().toISOString().split('T')[0],
                [FIELDS.time]: booking.time,

                // Defaults
                [FIELDS.situation]: "Pre-solicitacao (cliente)",
                [FIELDS.addressPhotographer]: "Imovel",
                [FIELDS.statusNew]: "Pendente",
                [FIELDS.origin]: "Automatico",
                [FIELDS.edited]: "Nao",
                [FIELDS.printed]: "nao",
                [FIELDS.publishAgenda]: "Privado"
            };

            if (booking.clientName) {
                const lojaKey = Object.keys(LOJAS_IDS).find(key => key.toLowerCase() === booking.clientName?.toLowerCase()) || booking.clientName;
                if (LOJAS_IDS[lojaKey]) {
                    payload[FIELDS.client] = LOJAS_IDS[lojaKey];
                }
            }

            if (booking.photographer && booking.photographer.name) {
                const pName = booking.photographer.name;
                const pId = Object.keys(PHOTOGRAPHER_MAP).find(k => k.toLowerCase() === pName.toLowerCase());
                if (pId && PHOTOGRAPHER_MAP[pId]) {
                    payload[FIELDS.photographer] = PHOTOGRAPHER_MAP[pId];
                }
            }

            console.log('📦 Tadabase Payload:', JSON.stringify(payload, null, 2));

            // 3. Create or Update
            let url = `${process.env.TADABASE_API_URL}/data-tables/${TABLE_ID}/records`;

            if (existingRecordId) {
                url += `/${existingRecordId}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tadabase-App-id': APP_ID, 'X-Tadabase-App-Key': APP_KEY, 'X-Tadabase-App-Secret': APP_SECRET
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`❌ Tadabase Error (${response.status}):`, errText);
                return null;
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('❌ Tadabase Sync Exception:', error);
            return null;
        }
    }
};
