import * as dotenv from 'dotenv';
dotenv.config();

async function fetchFields() {
    const API_URL = process.env.TADABASE_API_URL + '';
    const APP_ID = process.env.TADABASE_APP_ID + '';
    const APP_KEY = process.env.TADABASE_APP_KEY + '';
    const APP_SECRET = process.env.TADABASE_APP_SECRET + '';
    const TABLE_ID = process.env.SOLICITACAO_TABLE_ID + '';

    console.log("Fetching fields for table:", TABLE_ID);

    try {
        const res = await fetch(`${API_URL}/data-tables/${TABLE_ID}/fields`, {
            method: 'GET',
            headers: {
                'X-Tadabase-App-id': APP_ID,
                'X-Tadabase-App-Key': APP_KEY,
                'X-Tadabase-App-Secret': APP_SECRET
            }
        });

        if (!res.ok) {
            console.error("Failed:", await res.text());
            return;
        }

        const data = await res.json();
        const fields = data.fields || [];
        console.log("Found", fields.length, "fields");

        console.log("LAST 10 FIELDS:");
        const lastFields = fields.slice(-10);
        lastFields.forEach((f: any) => console.log(f.slug, "-", f.name));
        if (fields.length > 0) {
            console.log("Sample field structure:", JSON.stringify(fields[0], null, 2));
        }

        const supabaseField = fields.find((f: any) => f.name && f.name.toLowerCase().includes('supabase'));

        if (supabaseField) {
            console.log("🎯 FOUND SUPABASE ID FIELD:");
            console.log(JSON.stringify(supabaseField, null, 2));
        } else {
            console.log("Supabase ID field not found. Did you name it exactly 'Supabase ID'?");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

fetchFields();
