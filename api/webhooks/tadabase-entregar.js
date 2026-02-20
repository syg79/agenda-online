// api/webhooks/tadabase-entregar.js
// CENÁRIO 3: ENTREGAR - Pasta compartilhada para entrega via Google Drive
//
// Acionado pelo: Tadabase Outgoing Webhook (quando fotos estão prontas para entrega)
// O que faz:
//   1. Cria estrutura de pastas: [Cliente] → [Data] → [Imóvel] → [Código]
//   2. Compartilha a pasta do código publicamente (link de leitura)
//   3. Compartilha também com o email interno (vitrinedoimovel@gmail.com)
//   4. Salva o link de volta no Tadabase (field_245)
//   5. Cria um rascunho no Gmail com o link para envio ao cliente
//
// Campos do Tadabase usados:
//   field_427  → Nome do cliente (1º nível da hierarquia)
//   field_425  → Data ou referência (2º nível)
//   field_426  → Nome do imóvel (3º nível)
//   field_233  → Código do imóvel (4º nível — pasta final compartilhada)
//   field_384  → Nome para o assunto do email
//   field_245  → Campo onde o link é salvo de volta no Tadabase

import { garantirPasta, compartilharComEmail, obterLinkPublico } from '../lib/google-drive.js';
import { criarRascunho } from '../lib/gmail.js';

// Pasta raiz da área de entrega (compartilhada com a Service Account)
const PASTA_ENTREGA_RAIZ = '1aXGLidGiePZMTp2vkEHNKZCJFZM2-wBQ';

// Email interno que recebe acesso a todas as pastas de entrega
const EMAIL_INTERNO = 'vitrinedoimovel@gmail.com';

// URL base da API do Tadabase para atualizar o registro
const TADABASE_APP_ID = process.env.TADABASE_APP_ID;   // ex: "abc123"
const TADABASE_API_KEY = process.env.TADABASE_API_KEY;
const TADABASE_SECRET = process.env.TADABASE_API_SECRET;
const TADABASE_TABLE = 'o6WQb5NnBZ'; // ID da tabela do Make

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    const nomeCliente = payload.field_427;
    const referencia = payload.field_425;
    const nomeImovel = payload.field_426;
    const codigoImovel = payload.field_233;
    const nomeEmail = payload.field_384;
    const recordId = payload.id;

    if (!nomeCliente || !referencia || !nomeImovel || !codigoImovel) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes: field_427, field_425, field_426, field_233'
      });
    }

    // ─── 1. Monta a hierarquia de pastas ──────────────────────────────────────
    // Nível 1: Cliente
    const pastaCliente = await garantirPasta(nomeCliente, PASTA_ENTREGA_RAIZ);

    // Nível 2: Data/Referência
    const pastaReferencia = await garantirPasta(referencia, pastaCliente.id);

    // Nível 3: Imóvel
    const pastaImovel = await garantirPasta(nomeImovel, pastaReferencia.id);

    // Nível 4: Código (pasta final — esta é a que será compartilhada)
    const pastaFinal = await garantirPasta(codigoImovel, pastaImovel.id);

    // ─── 2. Compartilhamentos ─────────────────────────────────────────────────
    // Compartilha com email interno
    await compartilharComEmail(pastaFinal.id, EMAIL_INTERNO);

    // Compartilha publicamente e obtém o link
    const linkPublico = await obterLinkPublico(pastaFinal.id);

    console.log(`Pasta de entrega criada: ${linkPublico}`);

    // ─── 3. Atualiza o Tadabase com o link ────────────────────────────────────
    await atualizarTadabase(recordId, linkPublico);

    // ─── 4. Cria rascunho no Gmail ────────────────────────────────────────────
    const assunto = `FOTOS: ${nomeEmail} (${nomeCliente})`;
    const corpo = `
      <p>Olá!</p>
      <p>Segue link para download</p>
      <p><strong>FOTOS:</strong></p>
      <p><a href="${linkPublico}">${linkPublico}</a></p>
      <p>Ficamos à disposição!</p>
    `;

    await criarRascunho(assunto, corpo);

    return res.status(200).json({
      sucesso: true,
      link: linkPublico,
      pastaId: pastaFinal.id,
    });

  } catch (err) {
    console.error('Erro em tadabase-entregar:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Função auxiliar: atualiza um campo no Tadabase via API REST ──────────────
async function atualizarTadabase(recordId, link) {
  const url = `https://api.tadabase.io/api/v1/data-pages/${TADABASE_APP_ID}/data-tables/${TADABASE_TABLE}/records/${recordId}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Tadabase-App-id': TADABASE_APP_ID,
      'X-Tadabase-App-Key': TADABASE_API_KEY,
      'X-Tadabase-App-Secret': TADABASE_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      field_245: link,  // campo do link de entrega
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Erro ao atualizar Tadabase: ${response.status} ${txt}`);
  }

  return response.json();
}
