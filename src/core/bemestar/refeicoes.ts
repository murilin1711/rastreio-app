import type { Refeicao } from '@core/regras/bemestar/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

const CAMPOS = 'id, em, tipo, descricao, quantidade, fome_antes, saciedade, local, observacao';
type Linha = { id: string; em: string; tipo: string; descricao: string; quantidade: string | null; fome_antes: number | null; saciedade: string | null; local: string | null; observacao: string | null };
const paraDominio = (l: Linha): Refeicao => ({ id: l.id, em: l.em, tipo: l.tipo as Refeicao['tipo'], descricao: l.descricao, quantidade: l.quantidade as Refeicao['quantidade'], fomeAntes: l.fome_antes, saciedade: l.saciedade as Refeicao['saciedade'], local: l.local as Refeicao['local'], observacao: l.observacao });

export async function listarRefeicoes(userId: string, f: { desde?: string; ate?: string } = {}): Promise<Refeicao[]> {
  let q = supabase.from('refeicoes').select(CAMPOS).eq('user_id', userId).order('em', { ascending: false });
  if (f.desde) q = q.gte('em', f.desde);
  if (f.ate) q = q.lte('em', f.ate);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(paraDominio);
}

export async function inserirRefeicao(userId: string, r: Omit<Refeicao, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('refeicoes').insert({ user_id: userId, em: r.em, tipo: r.tipo, descricao: r.descricao, quantidade: r.quantidade, fome_antes: r.fomeAntes, saciedade: r.saciedade, local: r.local, observacao: r.observacao }).select('id').single();
  if (error) throw traduzirErro(error);
  return data.id;
}

export async function excluirRefeicao(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('refeicoes').delete().eq('user_id', userId).eq('id', id);
  if (error) throw traduzirErro(error);
}
