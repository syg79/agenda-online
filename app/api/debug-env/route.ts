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

    return NextResponse.json(envStatus);
}
