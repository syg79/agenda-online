import { Booking } from '@prisma/client';

// Field Mappings from ApolarBot & User Feedback
export const FIELDS = {
    protocol: 'field_139',     // Referência
    address: 'field_94',       // Endereço (Object)
    complement: 'field_136',   // Complemento
    type: 'field_92',          // Tipo de Imóvel
    area: 'field_95',          // Área Total
    building: 'field_96',      // Nome do Condominio
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
    createdAt: 'field_89', // Data e Hora da Inclusao
    time: 'field_406', // Horario da Sessao
    protocolNew: 'field_490', // Protocolo de Agendamento
    dateTimeFull: 'field_407', // Date/Time completo
    sessionTimeSort: 'field_183', // Horario da sessao (para ordenacao)
    supabaseId: 'field_493', // Chave Única para evitar duplicidade (Supabase ID)
    conferido: 'field_474',    // Conferido (Sim/Nao)
    enviarVercel: 'field_494', // Testar Vercel (Sim/Nao)
    origemDosDados: 'field_495', // Origem dos Dados (Tadabase/Agenda Online) - Trava de Webhook Anti-Loop

    // Defaults from ApolarBot
    situation: 'field_219',    // Situação: "Pre-solicitacao (cliente)"
    addressPhotographer: 'field_275', // Endereço Fotógrafo: "Imovel"
    statusNew: 'field_386',    // Status Novo: "Pendente"
    origin: 'field_448',       // Origem: "Automatico"
    edited: 'field_251',       // Editado: "Nao"
    printed: 'field_306',      // Impresso: "nao"
    publishAgenda: 'field_223',// Publicar agenda: "Privado"
    cobranca: 'field_184',     // Cobrança: "A faturar"

    // Apolar Scraper Extras
    valorApolar: 'field_449', // Valor do imóvel Apolar
    situacaoApolar: 'field_450', // Situação Apolar
    dataAngariacao: 'field_451', // Data Angariação Apolar
    dataVencimento: 'field_452', // Data Vencimento 
    descritivoApolar: 'field_453', // Descritivo Apolar
    dormitoriosApolar: 'field_454', // Quantidade Dormitorios 
    garagemApolar: 'field_455', // Vagas de Garagem 
    obsInternas: 'field_456', // Observações Internas Apolar

    photographer: 'q3kjZDEN6V', // Fotografo (Connection)
};



// Quantity Fields (User Provided)
const COUNT_FIELDS = {
    photo: 'field_118',       // Fotos (3GDN1yqNeq)
    videoGround: 'field_187', // Video Paisagem + Retrato (P74QYvLjBE)
    videoDrone: 'field_188',  // Drone Video (ka6jMPMQ75)
    dronePhoto: 'field_417',  // Drone Fotos (6b1rA1OrKk)
    tour360: 'field_117',     // Tour 360 (6b1rALdjKk)
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

// Aliases for Apolar stores that have different names in the system but resolve to the same ID
const ALIAS_LOJAS_MAP: Record<string, string> = {
    "Uberaba": "J Americas",
    "Jardim das Americas": "J Americas",
    "Jd Americas": "J Americas",
    "Capao Raso": "C Raso",
    "Capão Raso": "C Raso",
    "Santa Candida": "S Candida",
    "Sta Candida": "S Candida",
    "Santa Felicidade": "S Felicidade",
    "Sta Felicidade": "S Felicidade",
    "Fazenda Rio Grande": "F Rio Grande",
    "Capao da Imbuia": "C Imbuia",
    "Centro Civico": "C Civico",
    "Campo Comprido": "C Comprido",
    "Santa Quiteria": "S Quiteria",
    "Sta Quiteria": "S Quiteria",
    "São Jose dos Pinhais": "SJPinhais",
    "Sao Jose dos Pinhais": "SJPinhais",
    "Jardim Social": "J Social",
    "Jd Social": "J Social",
    "Boa Vista": "B Vista",
    "Jardim Botanico": "J Botanico",
    "Jd Botanico": "J Botanico",
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

    async getPendingBookings() {
        const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = getEnv();
        if (!APP_ID || !APP_KEY || !APP_SECRET || !TABLE_ID) return [];

        try {
            const allItems = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                // Filter: Status is "Pendente"
                const url = `${API_URL}/data-tables/${TABLE_ID}/records?limit=100&page=${page}&filters[items][0][field_id]=${FIELDS.status}&filters[items][0][operator]=is&filters[items][0][val]=Pendente`;

                console.log(`🔎 Paginating Tadabase (Page ${page})...`);

                const res = await fetch(url, {
                    headers: {
                        'X-Tadabase-App-id': APP_ID,
                        'X-Tadabase-App-Key': APP_KEY,
                        'X-Tadabase-App-Secret': APP_SECRET
                    }
                });

                if (!res.ok) throw new Error(`API Error: ${res.status}`);

                const data = await res.json();
                const items = data.items || [];

                allItems.push(...items);

                if (data.has_more && data.current_page < data.total_pages) {
                    page++;
                } else {
                    hasMore = false;
                }

                // Safety break
                if (page > 10) hasMore = false;
            }

            return allItems;

        } catch (error) {
            console.error('Error fetching pendings:', error);
            return [];
        }
    },

    async getVercelTestBookings() {
        const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = getEnv();
        if (!APP_ID || !APP_KEY || !APP_SECRET || !TABLE_ID) return [];

        try {
            const allItems = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                // Filter: "Enviar Vercel" is "Sim"
                const url = `${API_URL}/data-tables/${TABLE_ID}/records?limit=100&page=${page}&filters[items][0][field_id]=${FIELDS.enviarVercel}&filters[items][0][operator]=is&filters[items][0][val]=Sim`;

                console.log(`🔎 Polling Tadabase for 'Vercel = Sim' (Page ${page})...`);

                const res = await fetch(url, {
                    headers: {
                        'X-Tadabase-App-id': APP_ID,
                        'X-Tadabase-App-Key': APP_KEY,
                        'X-Tadabase-App-Secret': APP_SECRET
                    }
                });

                if (!res.ok) throw new Error(`API Error: ${res.status}`);

                const data = await res.json();
                const items = data.items || [];

                allItems.push(...items);

                if (data.has_more && data.current_page < data.total_pages) {
                    page++;
                } else {
                    hasMore = false;
                }

                // Safety break
                if (page > 10) hasMore = false;
            }

            return allItems;

        } catch (error) {
            console.error('Error pulling Vercel tests:', error);
            return [];
        }
    },

    formatRecord(record: any) {
        if (!record) return null;

        // Helpers for reverse mapping
        const reverseServiceMap = (val: string) => Object.keys(SERVICE_MAP).find(key => SERVICE_MAP[key] === val) || val;
        const reverseTypeMap = (val: string) => Object.keys(TIPO_IMOVEL_MAP).find(key => TIPO_IMOVEL_MAP[key] === val) || val;

        const addressObj = record[FIELDS.address] || {};

        const getVal = (key: string) => {
            if (!record) return null;
            let val = record[key];

            // Aggressive extraction of strings from Tadabase objects
            if (record[`${key}_val`]) {
                val = record[`${key}_val`];
            } else if (Array.isArray(val) && val.length > 0) {
                if (typeof val[0] === 'object' && val[0] !== null && val[0].val) {
                    val = val[0].val;
                } else {
                    val = val[0];
                }
            } else if (typeof val === 'object' && val !== null && val.val) {
                val = val.val;
            }

            if (typeof val === 'object' && val !== null) {
                console.log(`[Tadabase] Field ${key} still an object after extraction:`, JSON.stringify(val));
                return null;
            }

            return val;
        };

        const formatted: any = {
            protocol: getVal(FIELDS.protocol),
            clientName: getVal(FIELDS.contactName) || getVal(FIELDS.client) || 'Cliente Desconhecido',
            clientEmail: getVal(FIELDS.contactEmail),
            clientPhone: getVal(FIELDS.contactPhone),
            brokerDetails: getVal(FIELDS.contactName),
            address: addressObj.address,
            neighborhood: addressObj.city,
            city: addressObj.state,
            zipCode: addressObj.zip,
            complement: getVal(FIELDS.complement),
            propertyType: reverseTypeMap(getVal(FIELDS.type)),
            area: getVal(FIELDS.area),
            services: (record[FIELDS.serviceType] || []).map(reverseServiceMap),
            date: getVal(FIELDS.date),
            time: getVal(FIELDS.time),
            notes: getVal(FIELDS.obsScheduling),
            latitude: addressObj.lat ? parseFloat(addressObj.lat) : null,
            longitude: addressObj.lng ? parseFloat(addressObj.lng) : null,
            photographerName: getVal(FIELDS.photographer),
        };

        const s = formatted.services;
        if (s.includes('drone_photo') && s.includes('drone_video')) {
            formatted.services = s.filter((item: string) => item !== 'drone_photo' && item !== 'drone_video');
            formatted.services.push('drone_photo_video');
        }

        return formatted;
    },

    async getFormattedBooking(protocol: string) {
        const record = await this.findRecordByProtocol(protocol);
        return this.formatRecord(record);
    },

    async syncBooking(booking: any, propertyData?: any) {
        const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = getEnv();

        if (!APP_ID || !APP_KEY || !APP_SECRET || !TABLE_ID) {
            console.error('❌ Tadabase credentials missing');
            return { error: '❌ Missing Credentials in .env' };
        }

        try {
            console.log(`[Tadabase] Sincronizando Booking: ${booking.protocol}`);

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
            let qtdVideoGround = 0; // field_187 (Landscape + Portrait)
            let qtdVideoDrone = 0;  // field_188
            let qtdDroneFotos = 0;  // field_417
            let qtdTour = 0;        // field_117

            // Helper to process internal service IDs
            const processService = (id: string) => {
                if (id === 'photo') qtdFotos++;
                if (id === 'video_landscape') qtdVideoGround++;
                if (id === 'video_portrait') qtdVideoGround++;

                if (id === 'drone_photo') qtdDroneFotos++;

                if (id === 'drone_video') qtdVideoDrone++; // Should not happen in UI, but good for safety

                if (id === 'tour_360') qtdTour++;

                if (id === 'drone_photo_video') {
                    // Combo: Drone Fotos + Drone Video
                    // User Request: Treat as UNIQUE service.
                    // "Drone Video + fotos" must be treated as independent.
                    // It maps to "Drone video" (field_188) + "Drone fotos" (checkbox strings)
                    // BUT for counting, User said "Drone Video" field_188 = 1.
                    // And "Drone Fotos" field_417 = 1.
                    // Wait, if I select the combo, do I get 1 in field_188 AND 1 in field_417?
                    // User said "Drone Video + fotos... unico".
                    // User provided list: "Marcou Drone video: field_188". "Marcou Drone Fotos: field_417".
                    // If I mark Combo, I should probably mark both IF the client expects 2 distinct deliverables.
                    // BUT User said "Lógica do Combo = errado... unico".
                    // I will assume for now that the Combo should increment BOTH counters because physically it delivers both.
                    // UNLESS field_188 IS the combo field.
                    // User said "Marcou Drone video: Quantidade: field_188".
                    // Since "Drone only video" does not exist, field_188 MUST be the Combo Video component.
                    // Does it imply Photos too?
                    // If I select "Drone Fotos" -> field_417.
                    // If I select "Drone Combo" -> field_188.
                    // DOES IT ALSO INCREMENT field_417?
                    // If I do, I am saying "I sold a Drone Photo service".
                    // If the User considers Combo as "Another thing", maybe `field_417` should NOT be incremented?
                    // I will try: Combo -> Increment ONLY `field_188`.
                    qtdVideoDrone++;
                    // qtdDroneFotos++; // REMOVED per user request to treat as independent.
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
                [FIELDS.protocol]: propertyData?.ref || booking.protocol, // Referência Apolar (Ref. Cliente) - O MAKE usava esse para gravar a ref
                [FIELDS.protocolNew]: booking.protocol,
                [FIELDS.complement]: booking.complement,
                [FIELDS.type]: TIPO_IMOVEL_MAP[booking.propertyType] || 'Ap',
                [FIELDS.area]: booking.area ? booking.area.toString() : '',
                [FIELDS.building]: booking.building,
                [FIELDS.address]: addressPayload,
                [FIELDS.serviceType]: serviceNames,
                [FIELDS.rede]: 'DVWQWRNZ49', // Apolar
                [FIELDS.client]: propertyData?.storeName ? LOJAS_IDS[propertyData.storeName] || '' : '', // Vincula a Loja Apolar correta como "Cliente"
                [FIELDS.origemDosDados]: 'Agenda Online', // Trava do Loop Infinito de Webhook

                // Apolar Scraper Extras
                [FIELDS.valorApolar]: propertyData?.price ? propertyData.price.toString() : '',
                [FIELDS.situacaoApolar]: propertyData?.situation || '',
                [FIELDS.dataAngariacao]: propertyData?.listingDate || '',
                [FIELDS.descritivoApolar]: propertyData?.description || '',
                [FIELDS.dormitoriosApolar]: propertyData?.bedrooms ? propertyData.bedrooms.toString() : '',
                [FIELDS.garagemApolar]: propertyData?.parkingSpaces ? propertyData.parkingSpaces.toString() : '',

                // Quantities
                [COUNT_FIELDS.photo]: qtdFotos,         // field_118
                [COUNT_FIELDS.videoGround]: qtdVideoGround, // field_187
                [COUNT_FIELDS.videoDrone]: qtdVideoDrone,   // field_188
                [COUNT_FIELDS.dronePhoto]: qtdDroneFotos,// field_417
                [COUNT_FIELDS.tour360]: qtdTour,        // field_117

                // Client Data
                [FIELDS.contactName]: booking.clientName,
                [FIELDS.contactEmail]: booking.clientEmail,
                [FIELDS.contactPhone]: booking.clientPhone,
                [FIELDS.obsScheduling]: booking.notes,

                // Date & Time
                // Se for nulo ou invalido (Teste de Cadastro), envia nulo pro Tadabase não agendar
                [FIELDS.date]: booking.date ? new Date(booking.date).toISOString().split('T')[0] : '',
                [FIELDS.requestDate]: new Date().toISOString().split('T')[0],
                [FIELDS.createdAt]: new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }), // MM/DD/YYYY, HH:MM:SS AM/PM funciona bem
                [FIELDS.time]: booking.time || '',
                [FIELDS.sessionTimeSort]: booking.time || '',
                [FIELDS.dateTimeFull]: booking.date && booking.time ? `${new Date(booking.date).toISOString().split('T')[0]} ${booking.time}` : '',

                // Sincronização da Chave Única (Supabase ID e Protocolo)
                [FIELDS.supabaseId]: booking.id, // O ID real UUID no Supabase

                // Dynamic Status Mapping (Supabase -> Tadabase)
                [FIELDS.status]: (() => {
                    const statusMap: Record<string, string> = {
                        'TEST': 'Pre-solicitacao', // Status inicial pro teste
                        'PENDING': 'Pendente',
                        'RESERVED': 'Reservado',
                        'RESERVADO': 'Reservado', // Forca caso venha em PT
                        'CONFIRMED': 'Agendado',
                        'AGENDADO': 'Agendado',
                        'REALIZADO': 'Realizado',
                        'COMPLETED': 'Realizado',
                        'WAITING': 'Aguardando Retorno',
                        'CANCELED': 'Cancelado',
                        'CANCELADO': 'Cancelado',
                    };
                    return statusMap[booking.status] || 'Pendente';
                })(),

                // Cobrança
                [FIELDS.cobranca]: 'A faturar',

                // Defaults
                [FIELDS.situation]: "Pre-solicitacao (cliente)",
                [FIELDS.addressPhotographer]: "Imovel",
                [FIELDS.statusNew]: "Pendente",
                [FIELDS.origin]: "Automatico",
                [FIELDS.edited]: "Nao",
                [FIELDS.printed]: "nao",
                [FIELDS.publishAgenda]: "Privado",
                [FIELDS.conferido]: "Nao"
            };

            if (booking.clientName) {
                // Remove prefixos comuns ("Apolar ", "Apolar Imóveis ") e limpa a string
                let cleanStoreName = booking.clientName.replace(/^Apolar\s+/i, '').trim();

                // Verifica se há um alias direto para o nome limpo
                const mappedName = Object.keys(ALIAS_LOJAS_MAP).find(
                    k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanStoreName.toLowerCase().replace(/[^a-z0-9]/g, '')
                );

                if (mappedName) {
                    cleanStoreName = ALIAS_LOJAS_MAP[mappedName];
                }

                const lojaKey = Object.keys(LOJAS_IDS).find(
                    key =>
                        key.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                        cleanStoreName.toLowerCase().replace(/[^a-z0-9]/g, '')
                );

                if (lojaKey && LOJAS_IDS[lojaKey]) {
                    payload[FIELDS.client] = LOJAS_IDS[lojaKey];
                } else {
                    console.warn(`⚠️ [Tadabase] Loja '${booking.clientName}' (limpa: '${cleanStoreName}') não encontrada no Dicionário LOJAS_IDS.`);
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
            console.error('❌ EXCEÇÃO NO SYNC TADABASE:', {
                message: error.message,
                protocol: booking.protocol,
                id: booking.id
            });
            if (error.response) {
                return { error: `Response Error: ${JSON.stringify(error.response.data)}` };
            }
            throw error;
        }
    }
};
