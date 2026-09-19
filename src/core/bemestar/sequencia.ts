import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

/** Dias com registro, dos mais recentes para trás. 120 dias bastam: o maior marco é 100. */
export async function listarDiasAtivos(userId: string, limite = 120): Promise<string[]> {
  const { data, error } = await supabase.from('dias_ativos').select('dia').eq('user_id', userId).order('dia', { ascending: false }).limit(limite);
  if (error) throw traduzirErro(error);
  return data.map((l) => l.dia);
}

/** Grava o marco de sequência comemorado. Nunca diminui. */
export async function registrarMarcoSequencia(userId: string, marco: number): Promise<void> {
  const { error } = await supabase.from('perfil_saude').update({ marco_sequencia_comemorado: marco }).eq('user_id', userId).lt('marco_sequencia_comemorado', marco);
  if (error) throw traduzirErro(error);
}
