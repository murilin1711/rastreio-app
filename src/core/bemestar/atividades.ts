import type { Atividade } from '@core/regras/bemestar/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

const CAMPOS = 'id, inicio, tipo, duracao_min, intensidade, distancia_km, fc_media, calorias, observacao';
type Linha = { id: string; inicio: string; tipo: string; duracao_min: number; intensidade: string; distancia_km: number | null; fc_media: number | null; calorias: number | null; observacao: string | null };
const paraDominio = (l: Linha): Atividade => ({ id: l.id, inicio: l.inicio, tipo: l.tipo as Atividade['tipo'], duracaoMin: l.duracao_min, intensidade: l.intensidade as Atividade['intensidade'], distanciaKm: l.distancia_km == null ? null : Number(l.distancia_km), fcMedia: l.fc_media, calorias: l.calorias, observacao: l.observacao });

export async function listarAtividades(userId: string, f: { desde?: string } = {}): Promise<Atividade[]> {
  let q = supabase.from('atividades').select(CAMPOS).eq('user_id', userId).order('inicio', { ascending: false });
  if (f.desde) q = q.gte('inicio', f.desde);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(paraDominio);
}

export async function inserirAtividade(userId: string, a: Omit<Atividade, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('atividades').insert({ user_id: userId, inicio: a.inicio, tipo: a.tipo, duracao_min: a.duracaoMin, intensidade: a.intensidade, distancia_km: a.distanciaKm, fc_media: a.fcMedia, calorias: a.calorias, observacao: a.observacao }).select('id').single();
  if (error) throw traduzirErro(error);
  return data.id;
}

export async function excluirAtividade(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('atividades').delete().eq('user_id', userId).eq('id', id);
  if (error) throw traduzirErro(error);
}
