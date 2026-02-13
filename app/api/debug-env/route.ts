import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const envStatus = {
        NODE_ENV: process.env.NODE_ENV,
        TADABASE_API_URL: process.env.TADABASE_API_URL || '❌ Missing',
        TADABASE_APP_ID: process.env.TADABASE_APP_ID || '❌ Missing',
        TADABASE_APP_KEY: process.env.TADABASE_APP_KEY ? '✅ Loaded' : '❌ Missing',
        TADABASE_APP_SECRET: process.env.TADABASE_APP_SECRET ?
            (process.env.TADABASE_APP_SECRET.substring(0, 4) + '...')
            : '❌ Missing',
        SOLICITACAO_TABLE_ID: process.env.SOLICITACAO_TABLE_ID ? '✅ Loaded' : '❌ Missing',
    };

    let connectionTest = "⏳ Not tested";
    try {
        const url = `${process.env.TADABASE_API_URL}/data-tables/${process.env.SOLICITACAO_TABLE_ID}/records?limit=1`;
        console.log(`Testing connection to: ${url}`);

        const res = await fetch(url, {
            headers: {
                'X-Tadabase-App-id': process.env.TADABASE_APP_ID!,
                'X-Tadabase-App-Key': process.env.TADABASE_APP_KEY!,
                'X-Tadabase-App-Secret': process.env.TADABASE_APP_SECRET!
            }
        });
        if (res.ok) {
            const data = await res.json();
            connectionTest = `✅ Success (200 OK) - Found ${data.items ? data.items.length : 0} records`;
        } else {
            const txt = await res.text();
            connectionTest = `❌ Failed (${res.status}): ${txt}`;
        }
    } catch (e: any) {
        connectionTest = `❌ Exception: ${e.message}`;
    }

    return NextResponse.json({ ...envStatus, connectionTest });
}
