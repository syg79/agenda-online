// api/webhooks/tadabase-arquivo.js
// CENÁRIO 1: ARQUIVO - FOTÓGRAFOS
//
// Acionado pelo: Tadabase Outgoing Webhook (quando status muda para "Arquivar" ou similar)
// O que faz:
//   1. Identifica o fotógrafo e sua pasta de trabalho
//   2. Localiza a pasta do imóvel dentro da pasta de data do fotógrafo
//   3. Na pasta de ARQUIVO centralizada: busca ou cria a pasta da data
//   4. Dentro da data do arquivo: busca ou cria subpasta com o nome do fotógrafo
//   5. Move a pasta do imóvel para lá
//
// Campos do Tadabase usados:
//   field_106  → Data do agendamento
//   field_233  → Nome/código do imóvel
//   field_111  → Nome do fotógrafo
//
// Observação sobre o Sleep de 180s do Make:
//   No Make havia um sleep de 3 minutos para esperar o Drive propagar.
//   No Vercel isso não é necessário pois chamamos a API diretamente e
//   aguardamos cada resposta antes de prosseguir. Se este webhook for
//   acionado logo após a criação da pasta, aumente o timeout no Tadabase
//   ou use um webhook separado com trigger diferente (ex: mudança de status).

import { buscarPasta, garantirPasta, moverPasta } from '../lib/google-drive.js';
import { buscarFotografo } from '../lib/supabase.js';

// Pasta central de ARQUIVO (a mesma para todos os fotógrafos)
const PASTA_ARQUIVO_ID = '17iH4a6ZnQ9kzVaG7vrAt2eezSX4k5FGL';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    const nomeFotografo = payload.field_111;
    const dataAgendamento = payload.field_106;
    const nomeImovel = payload.field_233;

    if (!nomeFotografo || !dataAgendamento || !nomeImovel) {
      return res.status(400).json({
        error: 'Campos obrigatórios ausentes: field_111, field_106, field_233'
      });
    }

    // 1. Busca o fotógrafo → obtém a pasta de trabalho dele
    const fotografo = await buscarFotografo(nomeFotografo);

    // 2. Localiza a pasta da data na pasta de trabalho do fotógrafo
    const pastaDataFotografo = await buscarPasta(dataAgendamento, fotografo.drive_folder_id);
    if (!pastaDataFotografo) {
      return res.status(404).json({
        error: `Pasta da data "${dataAgendamento}" não encontrada na pasta de ${fotografo.nome}`
      });
    }

    // 3. Localiza a pasta do imóvel dentro da data
    const pastaImovel = await buscarPasta(nomeImovel, pastaDataFotografo.id);
    if (!pastaImovel) {
      return res.status(404).json({
        error: `Pasta do imóvel "${nomeImovel}" não encontrada`
      });
    }

    // 4. No ARQUIVO centralizado: busca ou cria a pasta da data
    const pastaDataArquivo = await garantirPasta(dataAgendamento, PASTA_ARQUIVO_ID);

    // 5. Dentro da data do arquivo: busca ou cria subpasta com nome do fotógrafo
    const pastaFotografoArquivo = await garantirPasta(fotografo.nome, pastaDataArquivo.id);

    // 6. Move a pasta do imóvel para dentro da pasta do fotógrafo no arquivo
    await moverPasta(pastaImovel.id, pastaFotografoArquivo.id);

    console.log(`Arquivado: ${nomeImovel} → ARQUIVO/${dataAgendamento}/${fotografo.nome}/`);

    return res.status(200).json({
      sucesso: true,
      fotografo: fotografo.nome,
      pastaMovida: pastaImovel.id,
      destino: pastaFotografoArquivo.id,
    });

  } catch (err) {
    console.error('Erro em tadabase-arquivo:', err);
    return res.status(500).json({ error: err.message });
  }
}
