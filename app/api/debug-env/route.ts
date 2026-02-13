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

    const endpoints = [
        { name: "ENV: api.tadabase.io", url: `https://api.tadabase.io/api/v1/data-tables/o6WQb5NnBZ/records?limit=1`, appId: process.env.TADABASE_APP_ID, key: process.env.TADABASE_APP_KEY, secret: process.env.TADABASE_APP_SECRET },
        { name: "HARD: api.tadabase.io", url: `https://api.tadabase.io/api/v1/data-tables/o6WQb5NnBZ/records?limit=1`, appId: "DXQ80qgQYR", key: "GGnMopK42ONX", secret: "vqPOTT37VSLfQkBgZGd0ZVajf7Ry4Vkh" },
        // { name: "HARD: vitrinedoimovel", url: `https://vitrinedoimovel.tadabase.io/api/v1/data-tables/o6WQb5NnBZ/records?limit=1`, appId: "DXQ80qgQYR", key: "GGnMopK42ONX", secret: "vqPOTT37VSLfQkBgZGd0ZVajf7Ry4Vkh" }
    ];

    const results: any[] = [];

    for (const ep of endpoints) {
        try {
            console.log(`Testing ${ep.name}...`);
            const res = await fetch(ep.url, {
                headers: {
                    'X-Tadabase-App-id': (ep.appId || '').trim(),
                    'X-Tadabase-App-Key': (ep.key || '').trim(),
                    'X-Tadabase-App-Secret': (ep.secret || '').trim()
                }
            });

            if (res.ok) {
                results.push({ name: ep.name, status: `✅ Success (${res.status})` });
            } else {
                const txt = await res.text();
                results.push({ name: ep.name, status: `❌ Failed (${res.status}): ${txt}` });
            }
        } catch (e: any) {
            results.push({ name: ep.name, status: `❌ Exception: ${e.message}` });
        }
    }

    return NextResponse.json({ ...envStatus, results });
}
