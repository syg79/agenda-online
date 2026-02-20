// app/api/webhooks/tadabase-entregar/route.ts
// CENÁRIO 3: ENTREGAR - Pasta compartilhada para entrega via Google Drive
//
// Campos do Tadabase usados:
//   field_427  → Nome do cliente
//   field_425  → Data ou referência
//   field_426  → Nome do imóvel
//   field_233  → Código do imóvel (pasta final compartilhada)
//   field_384  → Nome para o assunto do email
//   field_245  → Campo onde o link é salvo de volta no Tadabase

import { NextRequest, NextResponse } from 'next/server';
import { garantirPasta, compartilharComEmail, obterLinkPublico } from '@/lib/google-drive';
import { criarRascunho } from '@/lib/gmail';

const PASTA_ENTREGA_RAIZ = '1aXGLidGiePZMTp2vkEHNKZCJFZM2-wBQ';
const EMAIL_INTERNO = 'vitrinedoimovel@gmail.com';

const TADABASE_APP_ID = process.env.TADABASE_APP_ID!;
const TADABASE_API_KEY = process.env.TADABASE_API_KEY!;
const TADABASE_SECRET = process.env.TADABASE_API_SECRET!;
const TADABASE_TABLE = 'o6WQb5NnBZ';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const nomeCliente = payload.field_427;
    const referencia = payload.field_425;
    const nomeImovel = payload.field_426;
    const codigoImovel = payload.field_233;
    const nomeEmail = payload.field_384;
    const recordId = payload.id;

    if (!nomeCliente || !referencia || !nomeImovel || !codigoImovel) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: field_427, field_425, field_426, field_233' },
        { status: 400 }
      );
    }

    // 1. Monta a hierarquia de pastas
    const pastaCliente = await garantirPasta(nomeCliente, PASTA_ENTREGA_RAIZ);
    const pastaReferencia = await garantirPasta(referencia, pastaCliente.id);
    const pastaImovel = await garantirPasta(nomeImovel, pastaReferencia.id);
    const pastaFinal = await garantirPasta(codigoImovel, pastaImovel.id);

    // 2. Compartilhamentos
    await compartilharComEmail(pastaFinal.id, EMAIL_INTERNO);
    const linkPublico = await obterLinkPublico(pastaFinal.id);
    console.log(`Pasta de entrega criada: ${linkPublico}`);

    if (!linkPublico) {
      throw new Error('Link público não gerado');
    }

    if (!recordId) {
      throw new Error('ID do registro Tadabase não fornecido');
    }

    // 3. Atualiza o Tadabase com o link
    await atualizarTadabase(String(recordId), linkPublico);

    // 4. Cria rascunho no Gmail
    const assunto = `FOTOS: ${nomeEmail} (${nomeCliente})`;
    const corpo = `
      <p>Olá!</p>
      <p>Segue link para download</p>
      <p><strong>FOTOS:</strong></p>
      <p><a href="${linkPublico}">${linkPublico}</a></p>
      <p>Ficamos à disposição!</p>
    `;
    await criarRascunho(assunto, corpo);

    return NextResponse.json({
      sucesso: true,
      link: linkPublico,
      pastaId: pastaFinal.id,
    });

  } catch (err: any) {
    console.error('Erro em tadabase-entregar:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function atualizarTadabase(recordId: string, link: string) {
  const url = `https://api.tadabase.io/api/v1/data-pages/${TADABASE_APP_ID}/data-tables/${TADABASE_TABLE}/records/${recordId}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Tadabase-App-id': TADABASE_APP_ID,
      'X-Tadabase-App-Key': TADABASE_API_KEY,
      'X-Tadabase-App-Secret': TADABASE_SECRET,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ field_245: link }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw new Error(`Erro ao atualizar Tadabase: ${response.status} ${txt}`);
  }

  return response.json();
}
