import type { Vinculo } from '@core/regras/bemestar/vinculos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

/** Um vínculo por glicemia (upsert); RLS pelo dono da medida. */
export async function salvarVinculo(v: Vinculo): Promise<void> {
  const { error } = await supabase.from('vinculos_glicemia').upsert({ glicemia_id: v.glicemiaId, refeicao_id: v.refeicaoId, atividade_id: v.atividadeId }, { onConflict: 'glicemia_id' });
  if (error) throw traduzirErro(error);
}

/** Vínculos das glicemias do usuário desde uma data (junta com `medidas` pela RLS). */
export async function listarVinculos(userId: string, desde?: string): Promise<Vinculo[]> {
  let q = supabase.from('medidas').select('id, vinculos_glicemia(refeicao_id, atividade_id)').eq('user_id', userId).eq('tipo', 'glicemia');
  if (desde) q = q.gte('medido_em', desde);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  const out: Vinculo[] = [];
  for (const l of data as unknown as { id: string; vinculos_glicemia: { refeicao_id: string | null; atividade_id: string | null } | { refeicao_id: string | null; atividade_id: string | null }[] | null }[]) {
    const v = Array.isArray(l.vinculos_glicemia) ? l.vinculos_glicemia[0] : l.vinculos_glicemia;
    if (v) out.push({ glicemiaId: l.id, refeicaoId: v.refeicao_id, atividadeId: v.atividade_id });
  }
  return out;
}
