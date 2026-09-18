import type { MedidaCorporal } from '@core/regras/bemestar/tipos';
import { supabase } from '@core/supabase/client';
import type { Json } from '@core/supabase/database.types';
import { traduzirErro } from '@core/supabase/erros';

const TIPOS: MedidaCorporal['tipo'][] = ['peso', 'cintura', 'quadril', 'composicao'];
type Linha = { id: string; tipo: string; medido_em: string; valores: unknown };
const paraDominio = (l: Linha): MedidaCorporal => ({ id: l.id, tipo: l.tipo as MedidaCorporal['tipo'], medidoEm: l.medido_em, valores: (l.valores ?? {}) as MedidaCorporal['valores'] });

export async function listarCorporais(userId: string, f: { tipo?: MedidaCorporal['tipo']; desde?: string } = {}): Promise<MedidaCorporal[]> {
  let q = supabase.from('medidas').select('id, tipo, medido_em, valores').eq('user_id', userId).in('tipo', f.tipo ? [f.tipo] : TIPOS).order('medido_em', { ascending: false });
  if (f.desde) q = q.gte('medido_em', f.desde);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(paraDominio);
}

export async function inserirCorporal(userId: string, m: { tipo: MedidaCorporal['tipo']; medidoEm: string; valores: MedidaCorporal['valores']; contexto?: Record<string, unknown> }): Promise<string> {
  const { data, error } = await supabase.from('medidas').insert({ user_id: userId, tipo: m.tipo, medido_em: m.medidoEm, valores: m.valores as Json, contexto: (m.contexto ?? {}) as Json }).select('id').single();
  if (error) throw traduzirErro(error);
  return data.id;
}

export async function excluirCorporal(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('medidas').delete().eq('user_id', userId).eq('id', id);
  if (error) throw traduzirErro(error);
}

/** Última medida de cada tipo corporal. */
export async function ultimoPorTipoCorporal(userId: string): Promise<Record<MedidaCorporal['tipo'], MedidaCorporal | null>> {
  const todas = await listarCorporais(userId);
  const out = { peso: null, cintura: null, quadril: null, composicao: null } as Record<MedidaCorporal['tipo'], MedidaCorporal | null>;
  for (const m of todas) if (!out[m.tipo]) out[m.tipo] = m;
  return out;
}
