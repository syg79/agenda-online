// /lib/supabase.js
// Cliente do Supabase compartilhado entre todas as funções.

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role para operações de backend
);

/**
 * Busca os dados de um fotógrafo pelo nome.
 * Nome deve bater exatamente com o campo field_111 do Tadabase.
 */
export async function buscarFotografo(nome) {
  const { data, error } = await supabase
    .from('fotografos')
    .select('*')
    .eq('nome', nome)
    .eq('ativo', true)
    .single();

  if (error) throw new Error(`Fotógrafo "${nome}" não encontrado no banco. Cadastre-o na tabela fotografos.`);
  return data;
}
