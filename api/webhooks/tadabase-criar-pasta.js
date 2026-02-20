// api/webhooks/tadabase-criar-pasta.js
// CENÁRIO 2: CRIA PASTA DO IMÓVEL NA DATA DO AGENDAMENTO
//
// Acionado pelo: Tadabase Outgoing Webhook (quando agendamento é criado/atualizado)
// O que faz:
//   1. Identifica o fotógrafo pelo nome
//   2. Na pasta do fotógrafo: busca ou cria a pasta com a data do agendamento
//   3. Dentro da data: busca ou cria a pasta do imóvel (com subpasta se houver)
//   4. Compartilha publicamente como "leitor"
//
// Campos do Tadabase usados:
//   field_106  → Data do agendamento (nome da pasta de data)
//   field_233  → Nome/código do imóvel
//   field_234  → Subpasta do imóvel (opcional)
//   field_139  → Referência (usada para verificar duplicatas)
//   field_111  → Nome do fotógrafo

import { garantirPasta, criarPasta } from '../lib/google-drive.js';
import { buscarFotografo } from '../lib/supabase.js';

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    const nomefotografo = payload.field_111;
    const dataAgendamento = payload.field_106;  // Ex: "2024-03-15" ou "15/03/2024"
    const nomeImovel = payload.field_233;
    const subpasta = payload.field_234;    // pode ser vazio

    // Validação básica
    if (!nomefotografo || !dataAgendamento || !nomeImovel) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes: field_111, field_106, field_233'
      });
    }

    // 1. Busca o fotógrafo no banco → obtém o drive_folder_id dele
    const fotografo = await buscarFotografo(nomefotografo);
    console.log(`Fotógrafo: ${fotografo.nome} | Pasta Drive: ${fotografo.drive_folder_id}`);

    // 2. Busca ou cria a pasta da DATA dentro da pasta do fotógrafo
    const pastaData = await garantirPasta(
      dataAgendamento,
      fotografo.drive_folder_id,
      true  // compartilhada como leitor
    );
    console.log(`Pasta da data: ${pastaData.id}`);

    // 3. Busca ou cria a pasta do IMÓVEL dentro da pasta da data
    const pastaImovel = await garantirPasta(
      nomeImovel,
      pastaData.id,
      true  // compartilhada como leitor
    );
    console.log(`Pasta do imóvel: ${pastaImovel.id}`);

    // 4. Se houver subpasta (field_234), cria também
    let pastaFinal = pastaImovel;
    if (subpasta) {
      pastaFinal = await garantirPasta(subpasta, pastaImovel.id, false);
      console.log(`Subpasta: ${pastaFinal.id}`);
    }

    return res.status(200).json({
      sucesso: true,
      fotografo: fotografo.nome,
      pastaDataId: pastaData.id,
      pastaImovelId: pastaImovel.id,
      pastaFinalId: pastaFinal.id,
      link: pastaImovel.webViewLink,
    });

  } catch (err) {
    console.error('Erro em tadabase-criar-pasta:', err);
    return res.status(500).json({ error: err.message });
  }
}
