/**
 * Quick test: calls scrapeProperty() and saves result as JSON
 * Usage: npx tsx scripts/test-scraper.ts 954531
 */

import { scrapeProperty, isMaintenanceWindow, validateRef } from '../../lib/apolar-scraper';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

async function main() {
    const ref = process.argv[2];

    if (!ref) {
        console.error('❌ Usage: npx tsx scripts/test-scraper.ts <REF>');
        console.error('   Example: npx tsx scripts/test-scraper.ts 954531');
        process.exit(1);
    }

    if (!validateRef(ref)) {
        console.error(`❌ REF "${ref}" inválida. Deve conter 6 dígitos.`);
        process.exit(1);
    }

    console.log('🔧 Config:');
    console.log(`   BROWSERLESS_URL: ${process.env.BROWSERLESS_URL ? '✅ set' : '❌ not set'}`);
    console.log(`   APOLAR_USER: ${process.env.APOLAR_USER ? '✅ set' : '❌ not set'}`);
    console.log(`   APOLAR_PASS: ${process.env.APOLAR_PASS ? '✅ set' : '❌ not set'}`);
    console.log(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? '✅ set' : '❌ not set'}`);

    if (isMaintenanceWindow()) {
        console.error('⚠️  ApolarNet em manutenção (02:00-06:00 BRT). Tente após às 06:00.');
        process.exit(1);
    }

    console.log(`\n🚀 Buscando REF ${ref}...`);
    console.log('⏳ Isso pode levar 1-2 minutos (login + navegação + extração)...\n');

    const startTime = Date.now();

    try {
        const result = await scrapeProperty(ref);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`\n✅ Sucesso! (${elapsed}s)\n`);
        console.log('📊 Resultado:');
        console.log(JSON.stringify(result, null, 2));

        // Save to JSON file
        const outputPath = path.resolve(__dirname, `scrape-result-${ref}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`\n💾 Salvo em: ${outputPath}`);

    } catch (error: any) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`\n❌ Erro após ${elapsed}s:`);
        console.error(error.message);
        process.exit(1);
    }
}

main();
