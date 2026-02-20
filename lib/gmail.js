// api/lib/gmail.js
// Helper para operações no Gmail via OAuth (Refresh Token).
// O Refresh Token é guardado no Supabase e nunca expira
// a menos que você revogue o acesso manualmente no Google.

import { google } from 'googleapis';
import { supabase } from './supabase.js';

/**
 * Cria um cliente autenticado do Gmail usando o Refresh Token
 * armazenado no Supabase.
 */
async function getGmailClient() {
  // Busca o refresh token no banco
  const { data, error } = await supabase
    .from('config')
    .select('valor')
    .eq('chave', 'gmail_refresh_token')
    .single();

  if (error || !data) {
    throw new Error('Refresh Token do Gmail não encontrado. Execute o script de setup: scripts/setup-gmail-token.js');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // redirect para copiar o código manualmente
  );

  oauth2Client.setCredentials({
    refresh_token: data.valor,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Cria um rascunho no Gmail.
 * @param {string} assunto - Assunto do email
 * @param {string} corpoHtml - Corpo do email em HTML
 * @param {string} [para] - Destinatário (opcional, pode ficar em branco no rascunho)
 */
export async function criarRascunho(assunto, corpoHtml, para = '') {
  const gmail = await getGmailClient();

  // Monta o email no formato RFC 2822
  const email = [
    `To: ${para}`,
    `Subject: =?UTF-8?B?${Buffer.from(assunto).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    corpoHtml,
  ].join('\r\n');

  const emailBase64 = Buffer.from(email).toString('base64url');

  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: { raw: emailBase64 },
    },
  });

  return res.data;
}
