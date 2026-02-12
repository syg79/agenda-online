import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function inspectFields() {
    const APP_ID = process.env.TADABASE_APP_ID;
    const APP_KEY = process.env.TADABASE_APP_KEY;
    const APP_SECRET = process.env.TADABASE_APP_SECRET;
    const TABLE_ID = process.env.SOLICITACAO_TABLE_ID;

    if (!APP_ID || !APP_KEY || !APP_SECRET || !TABLE_ID) {
        console.error('❌ Missing credentials in .env');
        return;
    }

    const url = `${process.env.TADABASE_API_URL}/data-tables/${TABLE_ID}/fields`;

    console.log(`🔍 Fetching fields for table ${TABLE_ID}...`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Tadabase-App-id': APP_ID, 'X-Tadabase-App-Key': APP_KEY, 'X-Tadabase-App-Secret': APP_SECRET
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();

        // Targeted search
        const targets = ["field_110", "Tipo do Servico"];

        const fields = data.fields || [];
        const found = fields.filter((f: any) => {
            const json = JSON.stringify(f).toLowerCase();
            return targets.some(t => json.includes(t.toLowerCase()));
        });

        console.log(`✅ Found ${found.length} matching fields:`);
        found.forEach((f: any) => {
            console.log(`- [${f.key}] ${f.name} (Type: ${f.type})`);
            if (f.key === 'field_110' || f.name === 'Tipo do Servico') {
                console.log('FULL FIELD OBJECT:', JSON.stringify(f, null, 2));
            }
        });

    } catch (error) {
        console.error('❌ Exception:', error);
    }
}

inspectFields();
