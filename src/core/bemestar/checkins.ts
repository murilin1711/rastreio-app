import type { Checkin } from '@core/regras/bemestar/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

const CAMPOS = 'id, semana, disposicao, alimentacao, atividade, sono, estresse, energia, bem_estar, observacao';
type Linha = { id: string; semana: string; disposicao: number | null; alimentacao: number | null; atividade: number | null; sono: number | null; estresse: number | null; energia: number | null; bem_estar: number | null; observacao: string | null };
const paraDominio = (l: Linha): Checkin => ({ id: l.id, semana: l.semana, disposicao: l.disposicao, alimentacao: l.alimentacao, atividade: l.atividade, sono: l.sono, estresse: l.estresse, energia: l.energia, bemEstar: l.bem_estar, observacao: l.observacao });

export async function listarCheckins(userId: string): Promise<Checkin[]> {
  const { data, error } = await supabase.from('checkins').select(CAMPOS).eq('user_id', userId).order('semana', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map(paraDominio);
}

/** Um check-in por semana (upsert em `user_id, semana`). */
export async function salvarCheckin(userId: string, c: Omit<Checkin, 'id'>): Promise<Checkin> {
  const { data, error } = await supabase.from('checkins').upsert({ user_id: userId, semana: c.semana, disposicao: c.disposicao, alimentacao: c.alimentacao, atividade: c.atividade, sono: c.sono, estresse: c.estresse, energia: c.energia, bem_estar: c.bemEstar, observacao: c.observacao }, { onConflict: 'user_id,semana' }).select(CAMPOS).single();
  if (error) throw traduzirErro(error);
  return paraDominio(data);
}
