
import 'dotenv/config';
import { tadabase } from '@/lib/tadabase';

async function main() {
    console.log('🔍 Listing Keys from One Tadabase Record...');

    // We'll reuse the logic from getPendingBookings
    const { API_URL, APP_ID, APP_KEY, APP_SECRET, TABLE_ID } = (tadabase as any).getEnv ? (tadabase as any).getEnv() : {
        API_URL: process.env.TADABASE_API_URL,
        APP_ID: process.env.TADABASE_APP_ID,
        APP_KEY: process.env.TADABASE_APP_KEY,
        APP_SECRET: process.env.TADABASE_APP_SECRET,
        TABLE_ID: process.env.SOLICITACAO_TABLE_ID
    };

    if (!API_URL) return;

    const url = `${API_URL}/data-tables/${TABLE_ID}/records?limit=1`;

    try {
        const res = await fetch(url, { headers: { 'X-Tadabase-App-id': APP_ID!, 'X-Tadabase-App-Key': APP_KEY!, 'X-Tadabase-App-Secret': APP_SECRET! } });
        const data = await res.json();

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const keys = Object.keys(item).sort();
            console.log('--- FOUND KEYS ---');
            console.log(keys.join(', '));

            console.log('\n--- SPECIFIC VALUES ---');
            console.log('field_177:', JSON.stringify(item['field_177']));
            console.log('field_177_val:', JSON.stringify(item['field_177_val']));
            console.log('W4yQkw3QgP:', JSON.stringify(item['W4yQkw3QgP']));

            // Search for value "W4yQkw3QgP" in keys or values?
            // The user said "field_177 (W4yQkw3QgP)". Maybe W4yQkw3QgP is the value? No.

        } else {
            console.log('No items found.');
        }

    } catch (e) {
        console.error(e);
    }
}

main();
