import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

/** §52: um sinal de alerta registrado sobrepõe o calendário de rastreamento até ser marcado como avaliado. */
export async function registrarSintoma(userId: string, programa: string, sintoma: string, observacao?: string): Promise<void> {
  const { error } = await supabase.from('sintomas_alarme').insert({ user_id: userId, programa, sintoma, observacao: observacao ?? null });
  if (error) throw traduzirErro(error);
}

export async function resolverSintoma(id: string): Promise<void> {
  const { error } = await supabase.from('sintomas_alarme').update({ resolvido_em: new Date().toISOString() }).eq('id', id);
  if (error) throw traduzirErro(error);
}
