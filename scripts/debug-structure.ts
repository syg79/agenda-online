
import 'dotenv/config';
import { tadabase } from '@/lib/tadabase';

async function main() {
    console.log('🔍 Deep Debugging Tadabase Record Structure...');

    const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = (tadabase as any).getEnv ? (tadabase as any).getEnv() : {
        API_URL: process.env.TADABASE_API_URL,
        APP_ID: process.env.TADABASE_APP_ID,
        APP_KEY: process.env.TADABASE_APP_KEY,
        APP_SECRET: process.env.TADABASE_APP_SECRET,
        TABLE_ID: process.env.SOLICITACAO_TABLE_ID
    };

    if (!API_URL || !TABLE_ID) {
        console.error('Missing Env Vars');
        return;
    }

    // Fetch 1 record that is NOT "Realizado"
    const url = `${API_URL}/data-tables/${TABLE_ID}/records?limit=1&filters[items][0][field_id]=field_114&filters[items][0][operator]=is not&filters[items][0][val]=Realizado`;

    console.log('Fetching:', url);

    const res = await fetch(url, {
        headers: {
            'X-Tadabase-App-id': APP_ID || '',
            'X-Tadabase-App-Key': APP_KEY || '',
            'X-Tadabase-App-Secret': APP_SECRET || ''
        }
    });

    if (!res.ok) {
        console.error('API Error:', res.status, await res.text());
        return;
    }

    const data = await res.json();
    if (data.items && data.items.length > 0) {
        const item = data.items[0];
        console.log('--- RECORD FOUND ---');
        console.log('ID:', item.id);

        // Log specific fields we are interested in
        console.log('\n--- FIELD 86 (Nome Cliente) ---');
        console.log('Raw:', JSON.stringify(item.field_86, null, 2));
        console.log('Val:', JSON.stringify(item.field_86_val, null, 2));

        console.log('\n--- FIELD 177 (Corretor) ---');
        console.log('Raw:', JSON.stringify(item.field_177, null, 2));
        console.log('Val:', JSON.stringify(item.field_177_val, null, 2));

        console.log('\n--- FIELD 139 (Protocolo / Ref) ---');
        console.log('Raw:', item.field_139);
        console.log('Val:', item.field_139_val);

        console.log('\n--- FIELD 94 (Endereço) ---');
        console.log('Raw:', JSON.stringify(item.field_94, null, 2));
    } else {
        console.log('No items found.');
    }
}

main();
