
import 'dotenv/config';
import { tadabase } from '@/lib/tadabase';

async function main() {
    console.log('🔍 Debugging Tadabase Fetch...');

    // 1. Fetch RAW data (no filters, just limit)
    const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = (tadabase as any).getEnv ? (tadabase as any).getEnv() : process.env;
    // getEnv is not exported, let's just use the fetch directly or expose it.
    // Actually, I can just use getPendingBookings if I remove the filter temporarily,
    // OR just copy the fetch logic here.

    // Re-implementing fetch to be sure
    const env = {
        API_URL: process.env.TADABASE_API_URL,
        APP_ID: process.env.TADABASE_APP_ID,
        APP_KEY: process.env.TADABASE_APP_KEY,
        APP_SECRET: process.env.TADABASE_APP_SECRET,
        TABLE_ID: process.env.SOLICITACAO_TABLE_ID // Using SOLICITACAO_TABLE_ID
    };

    console.log('Env:', { URL: env.API_URL, Table: env.TABLE_ID });

    if (!env.API_URL || !env.TABLE_ID) {
        console.error('Missing Env Vars');
        return;
    }

    // Filter out "Realizado" to find the "Pendentes"
    const url = `${env.API_URL}/data-tables/${env.TABLE_ID}/records?limit=500&filters[items][0][field_id]=field_114&filters[items][0][operator]=is not&filters[items][0][val]=Realizado`;
    console.log('Fetching:', url);

    const res = await fetch(url, {
        headers: {
            'X-Tadabase-App-id': env.APP_ID || '',
            'X-Tadabase-App-Key': env.APP_KEY || '',
            'X-Tadabase-App-Secret': env.APP_SECRET || ''
        }
    });

    if (!res.ok) {
        console.error('API Error:', res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log(`✅ Got ${data.items ? data.items.length : 0} items.`);

    if (data.items && data.items.length > 0) {
        const counts: Record<string, number> = {};
        data.items.forEach((item: any) => {
            const status = item.field_114 || 'NULL';
            const situation = item.field_219 || 'NULL';
            const key = `${status} (Sit: ${situation})`;
            counts[key] = (counts[key] || 0) + 1;
        });
        console.log('📊 Status Distribution (Non-Realizado):', counts);
    }
}

main();
