const fs = require('fs');
const path = require('path');

// Caminho do arquivo .env
const envPath = path.resolve(__dirname, '.env');

console.log(`🔍 Inspecionando arquivo: ${envPath}`);

if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado!');
  process.exit(1);
}

try {
  // Lê o arquivo como buffer para detectar encoding
  const buffer = fs.readFileSync(envPath);
  
  let content = '';

  // Verifica se tem bytes nulos (indicativo de UTF-16 LE gerado por PowerShell)
  if (buffer.indexOf(0x00) !== -1) {
    console.log('⚠️  Detectado formato UTF-16 (comum no Windows). Convertendo para UTF-8...');
    content = buffer.toString('utf16le');
  } else {
    content = buffer.toString('utf8');
  }

  // Remove BOM (Byte Order Mark) se existir
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  // Divide em linhas e limpa espaços
  const lines = content.split(/\r?\n/);
  const cleanLines = [];
  
  console.log('\n📋 Variáveis identificadas:');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return; // Ignora vazios e comentários
    
    // Tenta separar CHAVE=VALOR
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
      
    if (key) {
      console.log(`   ✅ ${key}`);
      cleanLines.push(`${key}=${val}`);
    }
  });

  // Reescreve o arquivo com codificação UTF-8 padrão
  fs.writeFileSync(envPath, cleanLines.join('\n'), { encoding: 'utf8' });
  
  console.log('\n✨ Arquivo .env corrigido e salvo como UTF-8!');
  console.log('👉 Agora rode: npm run test:env');

} catch (err) {
  console.error(`❌ Erro ao processar arquivo: ${err.message}`);
}