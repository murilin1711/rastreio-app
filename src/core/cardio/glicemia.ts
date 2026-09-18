import type { MedidaGlicemia } from '@core/regras/cardio/tiposGlicemia';
import { supabase } from '@core/supabase/client';
import type { Json } from '@core/supabase/database.types';
import { traduzirErro } from '@core/supabase/erros';
import { contextoGlicemiaParaBanco, linhaParaGlicemia } from './mapeamento';

export async function listarGlicemia(userId: string, f: { desde?: string; ate?: string; limite?: number } = {}): Promise<MedidaGlicemia[]> {
  let q = supabase.from('medidas').select('id, medido_em, valores, contexto, sessao_id').eq('user_id', userId).eq('tipo', 'glicemia').order('medido_em', { ascending: false });
  if (f.desde) q = q.gte('medido_em', f.desde);
  if (f.ate) q = q.lte('medido_em', f.ate);
  if (f.limite) q = q.limit(f.limite);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(linhaParaGlicemia);
}

export async function inserirGlicemia(userId: string, e: { medidoEm: string; mgdl: number; momento: MedidaGlicemia['momento']; contexto: MedidaGlicemia['contexto']; observacao?: string }): Promise<string> {
  const { data, error } = await supabase
    .from('medidas')
    .insert({ user_id: userId, tipo: 'glicemia', medido_em: e.medidoEm, valores: { mgdl: e.mgdl }, contexto: contextoGlicemiaParaBanco(e.momento, e.contexto) as Json, observacao: e.observacao ?? null })
    .select('id')
    .single();
  if (error) throw traduzirErro(error);
  return data.id;
}
