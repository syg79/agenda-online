
import 'dotenv/config';
import { tadabase } from '@/lib/tadabase';

async function main() {
    console.log('🔍 Inspecting Raw Tadabase Response...');

    // We'll reuse the logic from getPendingBookings but stop after 1 item and log it fully
    const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = (tadabase as any).getEnv ? (tadabase as any).getEnv() : {
        API_URL: process.env.TADABASE_API_URL,
        APP_ID: process.env.TADABASE_APP_ID,
        APP_KEY: process.env.TADABASE_APP_KEY,
        APP_SECRET: process.env.TADABASE_APP_SECRET,
        TABLE_ID: process.env.SOLICITACAO_TABLE_ID
    };

    if (!API_URL) {
        // Fallback if getEnv is not exported or accessible
        console.error("Could not load env vars");
        return;
    }

    const url = `${API_URL}/data-tables/${TABLE_ID}/records?limit=1`;
    console.log(`Fetching from: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'X-Tadabase-App-id': APP_ID!,
                'X-Tadabase-App-Key': APP_KEY!,
                'X-Tadabase-App-Secret': APP_SECRET!
            }
        });

        if (!res.ok) {
            console.error(`Status: ${res.status}`);
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        if (data.items && data.items.length > 0) {
            console.log('--- RAW ITEM KEYS ---');
            const item = data.items[0];
            Object.keys(item).forEach(k => {
                console.log(`${k}: ${JSON.stringify(item[k]).substring(0, 50)}...`);
            });
            console.log('--- FULL ITEM ---');
            console.log(JSON.stringify(item, null, 2));
        } else {
            console.log('No items found.');
        }

    } catch (e) {
        console.error(e);
    }
}

main();
