import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function findProtocolField() {
    const APP_ID = process.env.TADABASE_APP_ID;
    const APP_KEY = process.env.TADABASE_APP_KEY;
    const APP_SECRET = process.env.TADABASE_APP_SECRET;
    const TABLE_ID = process.env.SOLICITACAO_TABLE_ID;

    console.log(`Starting search... Table: ${TABLE_ID}`);

    const url = `${process.env.TADABASE_API_URL}/data-tables/${TABLE_ID}/fields`;

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
        const fields = data.fields || [];
        console.log(`Fetched ${fields.length} fields. Listing last 20:`);

        fields.slice(-20).forEach((f: any) => {
            console.log(`- ${f.name} -> Slug: ${f.slug} | Key: ${f.key}`);
            if (f.name === 'Protocolo de Agendamento') console.log(JSON.stringify(f));
        });

    } catch (error) {
        console.error('Exception:', error);
    }
}

findProtocolField();
