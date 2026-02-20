// app/api/webhooks/tadabase-criar-pasta/route.ts
// CENÁRIO 2: CRIA PASTA DO IMÓVEL NA DATA DO AGENDAMENTO
//
// Campos do Tadabase usados:
//   field_106  → Data do agendamento
//   field_233  → Nome/código do imóvel
//   field_234  → Subpasta do imóvel (opcional)
//   field_111  → Nome do fotógrafo

import { NextRequest, NextResponse } from 'next/server';
import { garantirPasta } from '@/lib/google-drive';
import { buscarFotografo } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const nomeFotografo  = payload.field_111;
    const dataAgendamento = payload.field_106;
    const nomeImovel    = payload.field_233;
    const subpasta      = payload.field_234;

    if (!nomeFotografo || !dataAgendamento || !nomeImovel) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: field_111, field_106, field_233' },
        { status: 400 }
      );
    }

    // 1. Busca o fotógrafo no banco → obtém o drive_folder_id dele
    const fotografo = await buscarFotografo(nomeFotografo);
    console.log(`Fotógrafo: ${fotografo.nome} | Pasta Drive: ${fotografo.drive_folder_id}`);

    // 2. Busca ou cria a pasta da DATA dentro da pasta do fotógrafo
    const pastaData = await garantirPasta(dataAgendamento, fotografo.drive_folder_id, true);
    console.log(`Pasta da data: ${pastaData.id}`);

    // 3. Busca ou cria a pasta do IMÓVEL dentro da pasta da data
    const pastaImovel = await garantirPasta(nomeImovel, pastaData.id, true);
    console.log(`Pasta do imóvel: ${pastaImovel.id}`);

    // 4. Se houver subpasta (field_234), cria também
    let pastaFinal = pastaImovel;
    if (subpasta) {
      pastaFinal = await garantirPasta(subpasta, pastaImovel.id, false);
      console.log(`Subpasta: ${pastaFinal.id}`);
    }

    return NextResponse.json({
      sucesso: true,
      fotografo: fotografo.nome,
      pastaDataId: pastaData.id,
      pastaImovelId: pastaImovel.id,
      pastaFinalId: pastaFinal.id,
      link: pastaImovel.webViewLink,
    });

  } catch (err: any) {
    console.error('Erro em tadabase-criar-pasta:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
