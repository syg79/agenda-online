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
    contactLink: 'field_137',  // Link Gmail
    obsPhotographer: 'field_112', // Observacao para o Fotografo
    date: 'field_103', // Data da Solicitação (Request Date)
    time: 'LX6QaR7jZk', // Horario da Sessao (Restored from previous context)

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

export const tadabase = {
    /**
     * Syncs a booking with Tadabase (Create or Update).
     */
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

            // 1. Search for existing record by Protocol (field_139)
            const filters = `filters[items][0][field_id]=${FIELDS.protocol}&filters[items][0][operator]=is&filters[items][0][val]=${booking.protocol}`;
            const searchUrl = `${process.env.TADABASE_API_URL}/data-tables/${TABLE_ID}/records?${filters}`;

            const searchRes = await fetch(searchUrl, {
                method: 'GET',
                headers: {
                    'X-Tadabase-App-id': APP_ID,
                    'X-Tadabase-App-Key': APP_KEY,
                    'X-Tadabase-App-Secret': APP_SECRET
                }
            });

            const searchData = await searchRes.json();
            let existingRecordId = null;
            if (searchData.items && searchData.items.length > 0) {
                existingRecordId = searchData.items[0].id;
                console.log(`🔎 Found existing record: ${existingRecordId}`);
            }

            // 2. Prepare Payload
            // Address Logic based on ApolarBot/GoogleService:
            // City -> Neighborhood (Sublocality)
            // State -> City (Locality/AdminArea2)
            // Zip -> ZipCode
            // Address -> Number + Street
            const addressPayload = {
                address: booking.address,
                city: booking.neighborhood || 'Curitiba',
                state: booking.city || 'Curitiba', // User: "E o Estado ficara com o valor da cidade"
                zip: booking.zipCode || '80000-000',
                country: 'Brasil'
            };

            const payload: any = {
                [FIELDS.protocol]: booking.protocol,
                [FIELDS.complement]: booking.complement,
                [FIELDS.type]: TIPO_IMOVEL_MAP[booking.propertyType] || 'Ap',
                [FIELDS.area]: booking.area ? booking.area.toString().replace('.', ',') : '0',
                [FIELDS.address]: addressPayload,
                [FIELDS.status]: 'Pendente',
                [FIELDS.serviceType]: ['Fotos'],
                [FIELDS.rede]: 'DVWQWRNZ49', // Apolar

                // Date & Time
                [FIELDS.date]: booking.date ? new Date(booking.date).toISOString().split('T')[0] : undefined,
                [FIELDS.time]: booking.time, // Sending Time

                // Defaults from ApolarBot
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

            // 3. Create or Update (Using POST for both as verified)
            let url = `${process.env.TADABASE_API_URL}/data-tables/${TABLE_ID}/records`;

            if (existingRecordId) {
                url += `/${existingRecordId}`;
                console.log(`📝 Updating record ${existingRecordId} for protocol ${booking.protocol} using POST`);
            } else {
                console.log(`uq Creating new record for protocol ${booking.protocol}`);
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tadabase-App-id': APP_ID,
                    'X-Tadabase-App-Key': APP_KEY,
                    'X-Tadabase-App-Secret': APP_SECRET
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`❌ Tadabase Error (${response.status}):`, errText);
                return null;
            }

            const result = await response.json();
            console.log('✅ Tadabase sync success:', result);
            return result;

        } catch (error) {
            console.error('❌ Tadabase Sync Exception:', error);
            return null;
        }
    }
};
