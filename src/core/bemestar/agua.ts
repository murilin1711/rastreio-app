import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import type { RegistroAgua } from '@core/regras/bemestar/tipos';

export type { RegistroAgua } from '@core/regras/bemestar/tipos';

/** Registros de água (tipo 'agua' em `medidas`), do mais recente para trás. */
export async function listarAgua(userId: string, desde: string): Promise<RegistroAgua[]> {
  const { data, error } = await supabase.from('medidas').select('id, medido_em, valores')
    .eq('user_id', userId).eq('tipo', 'agua').gte('medido_em', desde).order('medido_em', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map((l) => ({ id: l.id, medidoEm: l.medido_em, ml: Number((l.valores as { ml?: number })?.ml ?? 0) }));
}

export async function registrarAgua(userId: string, ml: number, medidoEm: string): Promise<void> {
  const { error } = await supabase.from('medidas').insert({ user_id: userId, tipo: 'agua', medido_em: medidoEm, valores: { ml } });
  if (error) throw traduzirErro(error);
}

export async function excluirAgua(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('medidas').delete().eq('user_id', userId).eq('id', id).eq('tipo', 'agua');
  if (error) throw traduzirErro(error);
}

/** Marca que a meta de hoje já foi comemorada, para não repetir no mesmo dia. */
export async function marcarMetaComemorada(userId: string, dia: string): Promise<void> {
  const { error } = await supabase.from('perfil_saude').update({ agua_meta_comemorada_em: dia }).eq('user_id', userId);
  if (error) throw traduzirErro(error);
}
