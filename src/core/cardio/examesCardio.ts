import { supabase } from '@core/supabase/client';
import type { Json } from '@core/supabase/database.types';
import { traduzirErro } from '@core/supabase/erros';
import { linhaParaExame, type ExameCardio } from './mapeamento';

const CAMPOS = 'id, tipo, categoria, data_realizacao, resultado, instituicao, solicitante, observacoes, laudo_texto';

export async function listarExamesCardio(userId: string, f: { categoria?: 'laboratorial' | 'cardiologico'; tipo?: string; desde?: string } = {}): Promise<ExameCardio[]> {
  let q = supabase.from('exames').select(CAMPOS).eq('user_id', userId).eq('modulo', 'cardio').order('data_realizacao', { ascending: false }).order('created_at', { ascending: false });
  if (f.categoria) q = q.eq('categoria', f.categoria);
  if (f.tipo) q = q.eq('tipo', f.tipo);
  if (f.desde) q = q.gte('data_realizacao', f.desde);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(linhaParaExame);
}

export async function buscarExame(userId: string, id: string): Promise<ExameCardio | null> {
  const { data, error } = await supabase.from('exames').select(CAMPOS).eq('user_id', userId).eq('id', id).maybeSingle();
  if (error) throw traduzirErro(error);
  return data ? linhaParaExame(data) : null;
}

export async function inserirExame(userId: string, e: { categoria: 'laboratorial' | 'cardiologico'; tipo: string; dataRealizacao: string; resultado: ExameCardio['resultado']; instituicao?: string; solicitante?: string; observacoes?: string }): Promise<string> {
  const { data, error } = await supabase
    .from('exames')
    .insert({ user_id: userId, modulo: 'cardio', categoria: e.categoria, tipo: e.tipo, data_realizacao: e.dataRealizacao, resultado: e.resultado as Json, instituicao: e.instituicao ?? null, solicitante: e.solicitante ?? null, observacoes: e.observacoes ?? null })
    .select('id')
    .single();
  if (error) throw traduzirErro(error);
  return data.id;
}

/** Último exame de cada tipo pedido (para o PREVENT, check-up e dashboard). */
export async function ultimoPorTipo(userId: string, tipos: string[]): Promise<Record<string, ExameCardio | null>> {
  const { data, error } = await supabase.from('exames').select(CAMPOS).eq('user_id', userId).eq('modulo', 'cardio').in('tipo', tipos).order('data_realizacao', { ascending: false });
  if (error) throw traduzirErro(error);
  const out: Record<string, ExameCardio | null> = Object.fromEntries(tipos.map((t) => [t, null]));
  for (const l of data) if (!out[l.tipo]) out[l.tipo] = linhaParaExame(l);
  return out;
}
