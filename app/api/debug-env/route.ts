import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const rawUrl = process.env.TADABASE_API_URL || '';
    const sanitizedUrl = rawUrl.trim().endsWith('/') ? rawUrl.trim().slice(0, -1) : rawUrl.trim();

    const envStatus = {
        NODE_ENV: process.env.NODE_ENV,
        TADABASE_API_URL: `Length: ${rawUrl.length} | Value: ${rawUrl}`,
        TADABASE_APP_ID: `Length: ${(process.env.TADABASE_APP_ID || '').length} | Value: ${process.env.TADABASE_APP_ID}`,
        TADABASE_APP_KEY: `Length: ${(process.env.TADABASE_APP_KEY || '').length} | Status: ${process.env.TADABASE_APP_KEY ? '✅ Present' : '❌ Missing'}`,
        TADABASE_APP_SECRET: `Length: ${(process.env.TADABASE_APP_SECRET || '').length} | Starts with: ${(process.env.TADABASE_APP_SECRET || '').substring(0, 4)}...`,
        SOLICITACAO_TABLE_ID: `Length: ${(process.env.SOLICITACAO_TABLE_ID || '').length} | Value: ${process.env.SOLICITACAO_TABLE_ID}`,
    };

    let connectionTest = "⏳ Not tested";
    try {
        const url = `${sanitizedUrl}/data-tables/${(process.env.SOLICITACAO_TABLE_ID || '').trim()}/records?limit=1`;
        console.log(`Testing connection to: ${url}`);

        const res = await fetch(url, {
            headers: {
                'X-Tadabase-App-id': (process.env.TADABASE_APP_ID || '').trim(),
                'X-Tadabase-App-Key': (process.env.TADABASE_APP_KEY || '').trim(),
                'X-Tadabase-App-Secret': (process.env.TADABASE_APP_SECRET || '').trim()
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
