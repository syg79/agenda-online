const dotenv = require('dotenv');
const { Client } = require('pg');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Carrega o arquivo .env da raiz do projeto
const envPath = path.resolve(__dirname, '.env');
console.log(`📂 Lendo configuração de: ${envPath}`);

if (fs.existsSync(envPath)) {
  // Lê o arquivo manualmente para mostrar o que o Node está vendo (Debug)
  const rawContent = fs.readFileSync(envPath);
  console.log(`   📄 Tamanho do arquivo: ${rawContent.length} bytes`);
  // Mostra os primeiros 50 caracteres para verificarmos se há "sujeira" ou codificação errada
  console.log(`   🔎 Início do conteúdo (raw): ${JSON.stringify(rawContent.toString('utf8').substring(0, 50))}`);
} else {
  console.error('   ❌ O arquivo .env NÃO foi encontrado neste caminho!');
}

dotenv.config({ path: envPath });

console.log('================================================');
console.log('🚀 INICIANDO DIAGNÓSTICO DE AMBIENTE (.ENV)');
console.log('================================================\n');

async function testSupabase() {
  console.log('1️⃣  Testando Conexão Supabase (PostgreSQL)...');
  
  const dbUrl = process.env.DATABASE_URL || '';
  console.log(`   ℹ️  URL carregada: ${dbUrl.replace(/:[^:@]*@/, ':****@')}`);

  if (!process.env.DATABASE_URL) {
    console.error('   ❌ Erro: DATABASE_URL não encontrada no .env');
    console.log('');
    return;
  }

  // Verifica se a senha possui colchetes que podem ser erro de digitação
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes(':[agenda-online')) {
    console.warn('   ⚠️  ALERTA: A senha no DATABASE_URL parece estar entre colchetes [ ]. Verifique se isso é intencional.');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necessário para Supabase/Neon em alguns ambientes
  });

  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`   ✅ Sucesso! Conectado ao DB. Hora do servidor: ${res.rows[0].now}`);
    await client.end();
  } catch (err) {
    console.error(`   ❌ Falha no Supabase: ${err.message}`);
  }
  console.log('');
}

async function testGmail() {
  console.log('2️⃣  Testando Autenticação Gmail (Resend/SMTP)...');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('   ❌ Erro: EMAIL_USER ou EMAIL_PASS estão vazios no .env');
    console.log('');
    return;
  }

  // Remove espaços da senha de app do Google, caso existam
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s/g, '') : '';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: pass
    }
  });

  try {
    await transporter.verify();
    console.log(`   ✅ Sucesso! Autenticado como ${process.env.EMAIL_USER}`);
  } catch (err) {
    console.error(`   ❌ Falha no Gmail: ${err.message}`);
  }
  console.log('');
}

async function testGoogleMaps() {
  console.log('3️⃣  Testando Google Maps API...');
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('   ❌ Erro: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY está vazia no .env');
    console.log('');
    return;
  }

  // Testa uma geocodificação simples (Sede do Google)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if (response.data.status === 'OK') {
      console.log('   ✅ Sucesso! API Key válida e Geocoding API ativa.');
    } else {
      console.error(`   ❌ Erro na API Maps: Status ${response.data.status} - ${response.data.error_message || ''}`);
    }
  } catch (err) {
    console.error(`   ❌ Falha na requisição Maps: ${err.message}`);
  }
  console.log('');
}

async function testTadabase() {
  console.log('4️⃣  Testando Tadabase API...');

  const apiUrl = process.env.TADABASE_API_URL;
  const tableId = process.env.SOLICITACAO_TABLE_ID;
  
  // Monta a URL para listar registros da tabela (limite de 1 para ser rápido)
  // Nota: A estrutura da URL depende da versão da API, assumindo padrão v1 conforme .env
  const requestUrl = `${apiUrl}/data-tables/${tableId}/records?limit=1`;

  const config = {
    headers: {
      'X-Tadabase-App-Id': process.env.TADABASE_APP_ID,
      'X-Tadabase-App-Key': process.env.TADABASE_APP_KEY,
      'X-Tadabase-App-Secret': process.env.TADABASE_APP_SECRET
    }
  };

  try {
    const response = await axios.get(requestUrl, config);
    console.log(`   ✅ Sucesso! Conectado ao Tadabase. Registros encontrados: ${response.data.total_items || response.data.items?.length || 'OK'}`);
  } catch (err) {
    console.error(`   ❌ Falha no Tadabase: ${err.response ? `Status ${err.response.status} - ${JSON.stringify(err.response.data)}` : err.message}`);
  }
  console.log('');
}

async function runTests() {
  await testSupabase();
  await testGmail();
  await testGoogleMaps();
  await testTadabase();
  
  console.log('================================================');
  console.log('🏁 DIAGNÓSTICO FINALIZADO');
  console.log('================================================');
}

runTests();