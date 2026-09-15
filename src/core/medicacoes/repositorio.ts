import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import type { Medicacao } from './tipos';

export async function listarMedicacoes(userId: string): Promise<Medicacao[]> {
  const { data, error } = await supabase
    .from('medicacoes')
    .select('*')
    .eq('user_id', userId)
    .order('ativa', { ascending: false })
    .order('nome');
  if (error) throw traduzirErro(error);
  return data.map((m) => ({
    id: m.id,
    nome: m.nome,
    dose: m.dose,
    horarios: (m.horarios as string[]) ?? [],
    desde: m.desde,
    ate: m.ate,
    prescritor: m.prescritor,
    ativa: m.ativa,
    observacao: m.observacao,
  }));
}

export async function salvarMedicacao(userId: string, m: Omit<Medicacao, 'id'> & { id?: string }): Promise<void> {
  const linha = {
    user_id: userId,
    nome: m.nome,
    dose: m.dose,
    horarios: m.horarios,
    desde: m.desde,
    ate: m.ate,
    prescritor: m.prescritor,
    ativa: m.ativa,
    observacao: m.observacao,
  };
  const { error } = m.id
    ? await supabase.from('medicacoes').update(linha).eq('id', m.id)
    : await supabase.from('medicacoes').insert(linha);
  if (error) throw traduzirErro(error);
}

/** Interromper preenche `ate` com hoje; reativar limpa. */
export async function alternarAtiva(id: string, ativa: boolean): Promise<void> {
  const { error } = await supabase
    .from('medicacoes')
    .update({ ativa, ate: ativa ? null : new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) throw traduzirErro(error);
}
