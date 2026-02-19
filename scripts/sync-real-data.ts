
/*
 * SCRIPT: sync-real-data.ts
 * 1. Limpa tabela Booking (preserva Photographers).
 * 2. Busca 'Pendente' do Tadabase.
 * 3. Insere no Prisma.
 */

import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { tadabase } from '@/lib/tadabase';

async function main() {
    console.log('🗑️  Limpando agendamentos antigos (Test Data)...');
    await prisma.booking.deleteMany({});

    console.log('🔄 Buscando dados reais do Tadabase (Status: Pendente)...');
    const rawItems = await tadabase.getPendingBookings();
    console.log(`📦 Encontrados ${rawItems.length} itens.`);

    let count = 0;
    for (const item of rawItems) {
        let bookingData: any = {};
        let fields: any = {};

        try {
            // Map Tadabase Item -> Prisma Booking
            // HELPER: Extract text from Tadabase fields (Handles Strings, Arrays of Strings, and Arrays of Objects)
            const getString = (val: any) => {
                if (!val) return null;
                // 1. Array handling
                if (Array.isArray(val)) {
                    if (val.length === 0) return null;
                    const first = val[0];
                    // If it's an object inside array (Connection field in _val), return .val
                    if (typeof first === 'object' && first !== null && 'val' in first) {
                        return String(first.val);
                    }
                    return String(first);
                }
                // 2. Object handling (Address field)
                if (typeof val === 'object') return JSON.stringify(val);
                // 3. String/Number
                return String(val);
            };

            fields = {
                // Protocol: Prefer field_139, fallback to Record ID
                protocol: getString(item['field_139']) || item.id,

                addressObj: item['field_94'] || {},

                // Client Name: Use _val (contains name) instead of raw (contains ID)
                clientName: getString(item['field_86_val']) || getString(item['field_86']),

                // Broker: Use _val
                brokerDetails: getString(item['field_177_val']),

                clientEmail: getString(item['field_375']),
                clientPhone: getString(item['field_491']),
                status: getString(item['field_114']),
                serviceType: item['field_110'] || [],
                dateRequested: item['field_103'],
                dateScheduled: item['field_106'],
                timeScheduled: getString(item['field_406']),

                // Address Mapping
                // City in Tadabase Address field often holds the Neighborhood for local stats
                neighborhood: (item['field_94'] || {}).city || '',
                city: (item['field_94'] || {}).state || 'Curitiba',
                address: (item['field_94'] || {}).address || '',
                latitude: (item['field_94'] || {}).lat,
                longitude: (item['field_94'] || {}).lng,
            };

            // FIX: If clientName is empty, try to find it elsewhere or fallback
            if (!fields.clientName || fields.clientName === '[object Object]') fields.clientName = "Cliente (Nome não ident.)";

            // Fix Address if missing
            if (!fields.address) fields.address = "Endereço não informado";
            if (!fields.neighborhood) fields.neighborhood = "Centro";

            // Create Booking
            bookingData = {
                id: fields.protocol || `TEMP-${Math.random()}`,
                protocol: fields.protocol || `TEMP-${Math.random()}`,
                clientName: fields.clientName || 'Cliente Sem Nome',
                clientEmail: fields.clientEmail || 'email@naoinformado.com',
                clientPhone: fields.clientPhone || '0000000000',
                address: fields.address,
                neighborhood: fields.neighborhood,
                city: fields.city || 'Curitiba',
                latitude: fields.latitude ? parseFloat(fields.latitude) : null,
                longitude: fields.longitude ? parseFloat(fields.longitude) : null,
                status: 'PENDING',
                notes: fields.brokerDetails ? String(fields.brokerDetails) : null,
                services: Array.isArray(fields.serviceType) ? fields.serviceType.map(s => String(s)) : [],
                date: fields.dateScheduled ? new Date(fields.dateScheduled) : new Date(),
                time: fields.timeScheduled || '00:00',
                duration: 60
            };


            // console.dir(bookingData, { depth: null }); // DEBUG
            // console.log('DEBUG DATA JSON:', JSON.stringify(bookingData, null, 2));

            await prisma.booking.create({ data: bookingData });
            count++;
            process.stdout.write('.');
        } catch (e: any) {
            console.error(`\n❌ Falha ao importar item ${item.id} (Ref: ${fields.protocol}):`);
            console.error(e.message || e);
            console.error('Data causing error:', JSON.stringify(bookingData, null, 2));
        }
    }

    console.log(`\n✅ Sincronização Finalizada! ${count} agendamentos importados.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
