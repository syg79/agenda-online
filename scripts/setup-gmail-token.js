import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import * as http from 'http';
import * as url from 'url';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REDIRECT_URI = 'http://localhost:3001';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.compose'];

async function main() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\n──────────────────────────────────────────────');
  console.log('SETUP DO GMAIL — Execute uma única vez');
  console.log('──────────────────────────────────────────────');
  console.log('\n1. Abra esta URL no navegador:\n');
  console.log(authUrl);
  console.log('\n2. Faça login e autorize o acesso');
  console.log('3. Aguarde... o código será capturado automaticamente\n');

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url, true);
      const code = parsed.query.code;
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h2>✅ Autorizado! Pode fechar esta aba e voltar ao terminal.</h2>');
        server.close();
        resolve(code);
      } else {
        res.writeHead(400);
        res.end('Código não encontrado.');
        reject(new Error('Código OAuth não recebido'));
      }
    });
    server.listen(3001, () => {
      console.log('Aguardando autorização no navegador...\n');
    });
  });

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error('\n❌ Refresh Token não recebido.');
    console.error('Revogue o acesso em https://myaccount.google.com/permissions e tente novamente.\n');
    process.exit(1);
  }

  const { error } = await supabase
    .from('config')
    .upsert({ chave: 'gmail_refresh_token', valor: tokens.refresh_token });

  if (error) {
    console.error('\n❌ Erro ao salvar no Supabase:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Refresh Token salvo com sucesso no Supabase!');
  console.log('O Gmail está pronto para uso automático.\n');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});