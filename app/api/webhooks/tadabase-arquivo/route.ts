// app/api/webhooks/tadabase-arquivo/route.ts
// CENÁRIO 1: ARQUIVO - FOTÓGRAFOS
//
// Campos do Tadabase usados:
//   field_106  → Data do agendamento
//   field_233  → Nome/código do imóvel
//   field_111  → Nome do fotógrafo

import { NextRequest, NextResponse } from 'next/server';
import { buscarPasta, garantirPasta, moverPasta } from '@/lib/google-drive';
import { buscarFotografo } from '@/lib/supabase';

const PASTA_ARQUIVO_ID = '17iH4a6ZnQ9kzVaG7vrAt2eezSX4k5FGL';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Helper to extract string from Tadabase Connection fields
    const getVal = (val: any) => {
      if (!val) return null;
      if (Array.isArray(val) && val.length > 0) {
        return typeof val[0] === 'object' ? val[0].val : val[0];
      }
      if (typeof val === 'object' && val.val) return val.val;
      return val;
    };

    const nomeFotografo = getVal(payload.field_111);
    const dataAgendamento = getVal(payload.field_106);
    const nomeImovel = getVal(payload.field_233);

    if (!nomeFotografo || !dataAgendamento || !nomeImovel) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: field_111, field_106, field_233' },
        { status: 400 }
      );
    }

    // 1. Busca o fotógrafo → obtém a pasta de trabalho dele
    const fotografo = await buscarFotografo(nomeFotografo);

    // 2. Localiza a pasta da data na pasta de trabalho do fotógrafo
    const pastaDataFotografo = await buscarPasta(dataAgendamento, fotografo.drive_folder_id);
    if (!pastaDataFotografo) {
      return NextResponse.json(
        { error: `Pasta da data "${dataAgendamento}" não encontrada na pasta de ${fotografo.nome}` },
        { status: 404 }
      );
    }

    // 3. Localiza a pasta do imóvel dentro da data
    const pastaImovel = await buscarPasta(nomeImovel, pastaDataFotografo.id);
    if (!pastaImovel) {
      return NextResponse.json(
        { error: `Pasta do imóvel "${nomeImovel}" não encontrada` },
        { status: 404 }
      );
    }

    // 4. No ARQUIVO centralizado: busca ou cria a pasta da data
    const pastaDataArquivo = await garantirPasta(dataAgendamento, PASTA_ARQUIVO_ID);

    // 5. Dentro da data do arquivo: busca ou cria subpasta com nome do fotógrafo
    const pastaFotografoArquivo = await garantirPasta(fotografo.nome, pastaDataArquivo.id);

    // 6. Move a pasta do imóvel para dentro da pasta do fotógrafo no arquivo
    await moverPasta(pastaImovel.id, pastaFotografoArquivo.id);

    console.log(`Arquivado: ${nomeImovel} → ARQUIVO/${dataAgendamento}/${fotografo.nome}/`);

    return NextResponse.json({
      sucesso: true,
      fotografo: fotografo.nome,
      pastaMovida: pastaImovel.id,
      destino: pastaFotografoArquivo.id,
    });

  } catch (err: any) {
    console.error('Erro em tadabase-arquivo:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
