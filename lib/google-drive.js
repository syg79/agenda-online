// /lib/google-drive.js
// Helper para todas as operações no Google Drive via Service Account.
// A Service Account autentica com as variáveis de ambiente — nunca expira.

import { google } from 'googleapis';

/**
 * Cria um cliente autenticado do Google Drive via Service Account.
 * As credenciais ficam nas variáveis de ambiente do Vercel.
 */
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Busca uma pasta pelo nome dentro de uma pasta pai.
 * Retorna o objeto da pasta ou null se não encontrar.
 */
export async function buscarPasta(nomePasta, pastaParenteId) {
  const drive = getDriveClient();

  const nome = nomePasta.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name = '${nome}' and '${pastaParenteId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, webViewLink)',
    pageSize: 1,
  });

  return res.data.files?.[0] || null;
}

/**
 * Cria uma pasta dentro de uma pasta pai.
 * Retorna o objeto da pasta criada.
 */
export async function criarPasta(nomePasta, pastaParenteId, compartilhar = false) {
  const drive = getDriveClient();

  const res = await drive.files.create({
    requestBody: {
      name: nomePasta,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [pastaParenteId],
    },
    fields: 'id, name, webViewLink',
  });

  const pasta = res.data;

  if (compartilhar) {
    await drive.permissions.create({
      fileId: pasta.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  }

  return pasta;
}

/**
 * Compartilha uma pasta com um usuário específico por email.
 */
export async function compartilharComEmail(pastaId, email) {
  const drive = getDriveClient();

  await drive.permissions.create({
    fileId: pastaId,
    requestBody: { role: 'reader', type: 'user', emailAddress: email },
  });
}

/**
 * Obtém o link de compartilhamento público de uma pasta.
 */
export async function obterLinkPublico(pastaId) {
  const drive = getDriveClient();

  // Garante que está compartilhada publicamente
  await drive.permissions.create({
    fileId: pastaId,
    requestBody: { role: 'reader', type: 'anyone', allowFileDiscovery: false },
  });

  const res = await drive.files.get({
    fileId: pastaId,
    fields: 'webViewLink',
  });

  return res.data.webViewLink;
}

/**
 * Move uma pasta para dentro de outra pasta.
 */
export async function moverPasta(pastaId, novaPastaParenteId) {
  const drive = getDriveClient();

  // Busca os parents atuais para remover
  const arquivo = await drive.files.get({
    fileId: pastaId,
    fields: 'parents',
  });

  const parentsAtuais = arquivo.data.parents?.join(',') || '';

  await drive.files.update({
    fileId: pastaId,
    addParents: novaPastaParenteId,
    removeParents: parentsAtuais,
    fields: 'id, parents',
  });
}

/**
 * Garante que uma pasta existe — busca ou cria se não encontrar.
 * Muito usado para criar a estrutura de datas sem duplicar pastas.
 */
export async function garantirPasta(nomePasta, pastaParenteId, compartilhar = false) {
  const existente = await buscarPasta(nomePasta, pastaParenteId);
  if (existente) return existente;
  return await criarPasta(nomePasta, pastaParenteId, compartilhar);
}
