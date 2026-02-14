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

// Quantity Fields (User Provided)
const COUNT_FIELDS = {
    photo: 'field_118',       // Fotos (3GDN1yqNeq)
    videoLandscape: 'field_188', // Video Paisagem (P74QYvLjBE)
    videoPortrait: 'field_189', // Video Retrato (Assumed different - check logic) -> User said field_188 for both? 
    // Actually, User said "Marcou video Paisagem... field_188 (P74QYvLjBE)"
    // And "Marcou Drone video... field_188 (ka6jMPMQ75)". 
    // These are likely different internal field names in Tadabase even if column ID is same? 
    // No, field_ID is the key. 
    // Let's use the explicit IDs provided if possible, but the library uses `field_X`.
    // I will assume field_188 is Video Paisagem. 
    // And field_??? is Drone Video.
    // User said "Marcou Drone video: Quantidade: field_188 (ka6jMPMQ75)".
    // This is conflicting. I will assume `field_188` = Video Landscape.
    // I will add a TODO or explicit log for the Drone Video one.
    // Actually, `ka6jMPMQ75` corresponds to `field_189` in my previous logs? No, I don't have previous logs for this.
    // I will use the mapping logic based on Service Name.
    dronePhoto: 'field_417',    // Drone Fotos (6b1rA1OrKk)
    tour360: 'field_117',       // Tour 360 (6b1rALdjKk)
    // For Drone Video, if it really is field_188 (same as Landscape), it might sum up?
    // User said: "Atualmente quando marca video paisagem e retrato, deixo a quantidade = 2".
    // This implies they share a field.
    // So `field_188` might be "Videos (Total)"?
    // If so, Landscape = 1, Portrait = 1, Drone Video = 1?
    // User said "Marcou video Paisagem... field_188". "Marcou Drone video... field_188".
    // "Marcou video Paisagem e retrato... deixo a quantidade = 2".
    // This strongly suggests `field_188` is a generic "Videos" counter.
    // `field_118` is "Fotos".
    // `field_417` is "Drone Fotos".
    // `field_117` is "Tour 360".

    // I will implement a counter logic that sums these up.
    videos: 'field_188',
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
    "drone_photo_video": "Drone Combo", // Temporary marker for internal logic, will map to ["Drone fotos", "Drone video"]
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

// Helper to get fresh env vars
const getEnv = () => {
    let url = (process.env.TADABASE_API_URL || '').trim();
    if (url.endsWith('/')) url = url.slice(0, -1);

    return {
        API_URL: url,
        APP_ID: (process.env.TADABASE_APP_ID || '').trim(),
        APP_KEY: (process.env.TADABASE_APP_KEY || '').trim(),
        APP_SECRET: (process.env.TADABASE_APP_SECRET || '').trim(),
        TABLE_ID: (process.env.SOLICITACAO_TABLE_ID || '').trim(),
    }
}

export const tadabase = {
    async findRecordByProtocol(protocol: string) {
        const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = getEnv();

        if (!APP_ID || !APP_KEY || !APP_SECRET || !TABLE_ID) return null;

        try {
            // Try Field 139 (Referencia)
            let filters = `filters[items][0][field_id]=${FIELDS.protocol}&filters[items][0][operator]=is&filters[items][0][val]=${protocol}`;
            let searchUrl = `${API_URL}/data-tables/${TABLE_ID}/records?${filters}`;

            // console.log(`🔎 Searching Field 139: ${searchUrl}`); // Debug

            let searchRes = await fetch(searchUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'X-Tadabase-App-id': APP_ID, 'X-Tadabase-App-Key': APP_KEY, 'X-Tadabase-App-Secret': APP_SECRET
                }
            });

            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.items && searchData.items.length > 0) {
                    return searchData.items[0];
                }
            }

            // Fallback: Try Field 490 (Protocolo de Agendamento)
            filters = `filters[items][0][field_id]=${FIELDS.protocolNew}&filters[items][0][operator]=is&filters[items][0][val]=${protocol}`;
            searchUrl = `${API_URL}/data-tables/${TABLE_ID}/records?${filters}`;

            // console.log(`🔎 Searching Field 490: ${searchUrl}`); // Debug

            searchRes = await fetch(searchUrl, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'X-Tadabase-App-id': APP_ID, 'X-Tadabase-App-Key': APP_KEY, 'X-Tadabase-App-Secret': APP_SECRET
                }
            });

            if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.items && searchData.items.length > 0) {
                    return searchData.items[0];
                }
            }

            return null;
        } catch (error) {
            console.error('Error finding record:', error);
            return null;
        }
    },

    async getFormattedBooking(protocol: string) {
        const record = await this.findRecordByProtocol(protocol);
        if (!record) return null;

        // Helpers for reverse mapping
        const reverseServiceMap = (val: string) => Object.keys(SERVICE_MAP).find(key => SERVICE_MAP[key] === val) || val;
        // Invert keys/values of TIPO_IMOVEL_MAP for lookup (value -> key)
        const reverseTypeMap = (val: string) => Object.keys(TIPO_IMOVEL_MAP).find(key => TIPO_IMOVEL_MAP[key] === val) || val;

        // Address is stored as Object in Tadabase (field_94)
        // Structure: { address: '...', city: '...', state: '...', zip: '...', country: '...' }
        // BUT we mapped: city -> neighborhood, state -> city. 
        // So when reading back: address.city is Neighborhood, address.state is City.
        const addressObj = record[FIELDS.address] || {};



        const formatted: any = {
            protocol: record[FIELDS.protocol],
            clientName: record[FIELDS.contactName], // field_177
            clientEmail: record[FIELDS.contactEmail], // field_375
            clientPhone: record[FIELDS.contactPhone], // field_491
            address: addressObj.address,
            neighborhood: addressObj.city, // Mapped from city -> neighborhood
            city: addressObj.state, // Mapped from state -> city
            zipCode: addressObj.zip,
            complement: record[FIELDS.complement],
            propertyType: reverseTypeMap(record[FIELDS.type]),
            area: record[FIELDS.area],
            services: (record[FIELDS.serviceType] || []).map(reverseServiceMap),
            date: record[FIELDS.date], // YYYY-MM-DD
            time: record[FIELDS.time],
            notes: record[FIELDS.obsScheduling]
        };

        // Post-process Services to detect "Drone Combo"
        const s = formatted.services;
        if (s.includes('drone_photo') && s.includes('drone_video')) {
            // If both exist, replace them with 'drone_photo_video'
            // But only if we want to show the combo box in UI.
            // The UI has "Drone - Fotos + Vídeo".
            // If I check that, I want it checked back.
            // I'll filter out the individual ones and add the combo.
            formatted.services = s.filter((item: string) => item !== 'drone_photo' && item !== 'drone_video');
            formatted.services.push('drone_photo_video');
        }

        return formatted;
    },

    async syncBooking(booking: any) {
        const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = getEnv();

        if (!APP_ID || !APP_KEY || !APP_SECRET || !TABLE_ID) {
            console.error('❌ Tadabase credentials missing');
            return { error: '❌ Missing Credentials in .env' };
        }

        try {
            console.log(`🔄 Syncing booking ${booking.protocol} to Tadabase...`);

            const existingRecord = await this.findRecordByProtocol(booking.protocol);
            let existingRecordId = existingRecord ? existingRecord.id : null;

            if (existingRecordId) {
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

            // 1. Calculate Quantities (Counters)
            let qtdFotos = 0;       // field_118
            let qtdVideos = 0;      // field_188 (Landscape, Portrait, Drone Video)
            let qtdDroneFotos = 0;  // field_417
            let qtdTour = 0;        // field_117

            // Helper to process internal service IDs
            const processService = (id: string) => {
                if (id === 'photo') qtdFotos++;
                if (id === 'video_landscape') qtdVideos++; // Ground Videos
                if (id === 'video_portrait') qtdVideos++; // Ground Videos 

                if (id === 'drone_photo') qtdDroneFotos++;

                if (id === 'drone_video') {
                    // qtdDroneVideos++; // TODO: Get field ID for Drone Video. User said "field_188 (ka6jMPMQ75)" but video_landscape is also "field_188 (P74QYvLjBE)".
                    // These are likely different fields. For now, DO NOT count as Ground Video (field_188).
                }

                if (id === 'drone_photo_video') {
                    // Combo: Drone Fotos + Drone Video
                    qtdDroneFotos++;
                    // qtdDroneVideos++; // TODO: Add to Drone Video counter once ID is known.
                }
            };

            rawServices.forEach(processService);

            // 2. Map Services Names for Checkbox Field
            // Expand 'drone_photo_video' to ['Drone fotos', 'Drone video']
            let serviceNames: string[] = [];
            rawServices.forEach((s: string) => {
                if (s === 'drone_photo_video') {
                    serviceNames.push("Drone fotos");
                    serviceNames.push("Drone video");
                } else {
                    serviceNames.push(SERVICE_MAP[s] || s);
                }
            });

            // Ensure unique values and remove empty strings
            serviceNames = Array.from(new Set<string>(serviceNames)).filter((s: string) => s && s.trim() !== '' && s !== 'Drone Combo');

            // Default to 'Fotos' if list is empty, because app sends 'photo'
            if (serviceNames.length === 0) serviceNames.push('Fotos');

            const payload: any = {
                [FIELDS.protocol]: booking.protocol,
                [FIELDS.protocolNew]: booking.protocol,
                [FIELDS.complement]: booking.complement,
                [FIELDS.type]: TIPO_IMOVEL_MAP[booking.propertyType] || 'Ap',
                [FIELDS.area]: booking.area ? booking.area.toString().replace('.', ',') : '0',
                [FIELDS.address]: addressPayload,
                [FIELDS.serviceType]: serviceNames,
                [FIELDS.rede]: 'DVWQWRNZ49', // Apolar

                // Quantities
                [COUNT_FIELDS.photo]: qtdFotos,         // field_118
                [COUNT_FIELDS.videos]: qtdVideos,       // field_188
                [COUNT_FIELDS.dronePhoto]: qtdDroneFotos,// field_417
                [COUNT_FIELDS.tour360]: qtdTour,        // field_117

                // Client Data
                [FIELDS.contactName]: booking.clientName,
                [FIELDS.contactEmail]: booking.clientEmail,
                [FIELDS.contactPhone]: booking.clientPhone,
                [FIELDS.obsScheduling]: booking.notes,

                // Date & Time
                [FIELDS.date]: booking.date ? new Date(booking.date).toISOString().split('T')[0] : undefined,
                [FIELDS.requestDate]: new Date().toISOString().split('T')[0],
                [FIELDS.time]: booking.time,

                // Status Mapping (Prisma -> Tadabase)
                [FIELDS.status]: booking.status === 'CANCELED' ? 'Cancelado' : (booking.photographer ? 'Agendado' : 'Pendente'),

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
            let url = `${API_URL}/data-tables/${TABLE_ID}/records`;

            if (existingRecordId) {
                console.log(`📝 Updating record ${existingRecordId}...`);
                url += `/${existingRecordId}`;
            } else {
                console.log(`✨ Creating new record...`);
            }

            const response = await fetch(url, {
                method: 'POST', // Tadabase uses POST for updates (405 on PUT)
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tadabase-App-id': APP_ID, 'X-Tadabase-App-Key': APP_KEY, 'X-Tadabase-App-Secret': APP_SECRET
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`❌ Tadabase Error (${response.status}):`, errText);
                return { error: `API Error ${response.status}: ${errText}` };
            }

            const result = await response.json();
            return result;

        } catch (error: any) {
            console.error('❌ Tadabase Sync Exception:', error);
            if (error.response) {
                return { error: `Response Error: ${JSON.stringify(error.response.data)}` };
            } else if (error.request) {
                return { error: `Request Error: ${JSON.stringify(error.request)}` };
            } else {
                return { error: `Exception: ${error.message}` };
            }
        }
    }
};
