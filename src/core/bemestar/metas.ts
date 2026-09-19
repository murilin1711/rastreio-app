import type { Meta } from '@core/regras/bemestar/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

const CAMPOS = 'id, tipo, valor, origem, detalhe, ativa, valor_inicial, marco_comemorado';
type Linha = { id: string; tipo: string; valor: number; origem: string; detalhe: string | null; ativa: boolean; valor_inicial: number | null; marco_comemorado: number };
const paraDominio = (l: Linha): Meta => ({ id: l.id, tipo: l.tipo as Meta['tipo'], valor: Number(l.valor), origem: l.origem as Meta['origem'], detalhe: l.detalhe, ativa: l.ativa, valorInicial: l.valor_inicial == null ? null : Number(l.valor_inicial), marcoComemorado: Number(l.marco_comemorado) });

export async function listarMetas(userId: string): Promise<Meta[]> {
  const { data, error } = await supabase.from('metas').select(CAMPOS).eq('user_id', userId).eq('ativa', true).order('created_at', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map(paraDominio);
}

/** Uma meta ativa por tipo: desativa a anterior e insere a nova (§79, §82). */
export async function definirMeta(userId: string, m: { tipo: Meta['tipo']; valor: number; origem: Meta['origem']; detalhe?: string | null; valorInicial?: number | null }): Promise<Meta> {
  const { error: e1 } = await supabase.from('metas').update({ ativa: false }).eq('user_id', userId).eq('tipo', m.tipo).eq('ativa', true);
  if (e1) throw traduzirErro(e1);
  const { data, error } = await supabase.from('metas').insert({ user_id: userId, tipo: m.tipo, valor: m.valor, origem: m.origem, detalhe: m.detalhe ?? null, valor_inicial: m.valorInicial ?? null }).select(CAMPOS).single();
  if (error) throw traduzirErro(error);
  return paraDominio(data);
}

export async function desativarMeta(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('metas').update({ ativa: false }).eq('user_id', userId).eq('id', id);
  if (error) throw traduzirErro(error);
}

/** Grava o marco comemorado (D-016). Nunca diminui: a conquista não é retirada. */
export async function registrarMarco(userId: string, id: string, marco: number): Promise<void> {
  const { error } = await supabase.from('metas').update({ marco_comemorado: marco }).eq('user_id', userId).eq('id', id).lt('marco_comemorado', marco);
  if (error) throw traduzirErro(error);
}
