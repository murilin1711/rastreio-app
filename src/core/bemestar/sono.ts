import { minutosDeSono } from '@core/regras/bemestar/sono';
import type { Sono } from '@core/regras/bemestar/tipos';
import { supabase } from '@core/supabase/client';
import type { Json } from '@core/supabase/database.types';
import { traduzirErro } from '@core/supabase/erros';

type Linha = { id: string; medido_em: string; valores: unknown; contexto: unknown };
const SNAKE: Record<string, keyof Sono['contexto']> = { acordou_noite: 'acordouNoite', cochilou: 'cochilou', dificuldade_adormecer: 'dificuldadeAdormecer', acordou_descansado: 'acordouDescansado' };
const CAMEL: Record<keyof Sono['contexto'], string> = { acordouNoite: 'acordou_noite', cochilou: 'cochilou', dificuldadeAdormecer: 'dificuldade_adormecer', acordouDescansado: 'acordou_descansado' };

function paraDominio(l: Linha): Sono {
  const v = (l.valores ?? {}) as { dormiu_em: string; acordou_em: string; minutos: number; qualidade?: number | null };
  const c = (l.contexto ?? {}) as Record<string, boolean>;
  const contexto: Sono['contexto'] = {};
  for (const [k, ck] of Object.entries(SNAKE)) if (c[k] != null) contexto[ck] = c[k];
  return { id: l.id, dormiuEm: v.dormiu_em, acordouEm: v.acordou_em, minutos: v.minutos, qualidade: (v.qualidade ?? null) as Sono['qualidade'], contexto };
}

/** Sono vive em `medidas` com tipo 'sono' (D-011); `medido_em` = hora de acordar. */
export async function listarSono(userId: string, f: { desde?: string } = {}): Promise<Sono[]> {
  let q = supabase.from('medidas').select('id, medido_em, valores, contexto').eq('user_id', userId).eq('tipo', 'sono').order('medido_em', { ascending: false });
  if (f.desde) q = q.gte('medido_em', f.desde);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(paraDominio);
}

export async function inserirSono(userId: string, s: { dormiuEm: string; acordouEm: string; qualidade: Sono['qualidade']; contexto: Sono['contexto'] }): Promise<string> {
  const minutos = minutosDeSono(s.dormiuEm, s.acordouEm);
  const contexto: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(s.contexto)) if (v != null) contexto[CAMEL[k as keyof Sono['contexto']]] = v;
  const { data, error } = await supabase.from('medidas').insert({ user_id: userId, tipo: 'sono', medido_em: s.acordouEm, valores: { dormiu_em: s.dormiuEm, acordou_em: s.acordouEm, minutos, qualidade: s.qualidade } as Json, contexto: contexto as Json }).select('id').single();
  if (error) throw traduzirErro(error);
  return data.id;
}

export async function excluirSono(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('medidas').delete().eq('user_id', userId).eq('id', id).eq('tipo', 'sono');
  if (error) throw traduzirErro(error);
}
