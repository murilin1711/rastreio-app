import type { MedidaPA, MotivoExclusao, PeriodoMrpa } from '@core/regras/cardio/tipos';
import { supabase } from '@core/supabase/client';
import type { Json } from '@core/supabase/database.types';
import { traduzirErro } from '@core/supabase/erros';

import { contextoParaBanco, linhaParaMedidaPA } from './mapeamento';

export async function listarPA(userId: string, f: { desde?: string; sessaoId?: string | null; limite?: number } = {}): Promise<MedidaPA[]> {
  let q = supabase.from('medidas').select('id, medido_em, valores, contexto, sessao_id').eq('user_id', userId).eq('tipo', 'pa').order('medido_em', { ascending: false });
  if (f.desde) q = q.gte('medido_em', f.desde);
  if (f.sessaoId === null) q = q.is('sessao_id', null);
  else if (f.sessaoId) q = q.eq('sessao_id', f.sessaoId);
  if (f.limite) q = q.limit(f.limite);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(linhaParaMedidaPA);
}

export async function inserirPACasual(userId: string, e: { medidoEm: string; pas: number; pad: number; fc: number | null; contexto: MedidaPA['contexto']; observacao?: string }): Promise<string> {
  const { data, error } = await supabase
    .from('medidas')
    .insert({ user_id: userId, tipo: 'pa', medido_em: e.medidoEm, valores: { pas: e.pas, pad: e.pad, fc: e.fc }, contexto: contextoParaBanco(e.contexto) as Json, observacao: e.observacao ?? null })
    .select('id')
    .single();
  if (error) throw traduzirErro(error);
  return data.id;
}

export async function inserirLoteMrpa(userId: string, sessaoId: string, periodo: PeriodoMrpa, trio: { pas: number; pad: number; fc: number | null; medidoEm: string; excluida: boolean; motivo: MotivoExclusao | null }[]): Promise<void> {
  const linhas = trio.map((m, i) => ({
    user_id: userId,
    tipo: 'pa',
    sessao_id: sessaoId,
    medido_em: m.medidoEm,
    valores: { pas: m.pas, pad: m.pad, fc: m.fc },
    contexto: { periodo, ordem: i + 1, ...(m.excluida ? { excluida: true, motivo_exclusao: m.motivo } : {}) },
  }));
  const { error } = await supabase.from('medidas').insert(linhas);
  if (error) throw traduzirErro(error);
}

/** O convite para MRPA (C-010) fica registrado em `lembretes` como evento de sistema já lido. */
export async function ultimoConviteMrpaEm(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('lembretes').select('agendado_para').eq('user_id', userId).eq('origem_tipo', 'sistema').eq('titulo', 'convite_mrpa').order('agendado_para', { ascending: false }).limit(1).maybeSingle();
  if (error) throw traduzirErro(error);
  return data?.agendado_para ?? null;
}

export async function registrarConviteMrpa(userId: string): Promise<void> {
  const { error } = await supabase.from('lembretes').insert({ user_id: userId, origem_tipo: 'sistema', agendado_para: new Date().toISOString(), titulo: 'convite_mrpa', mensagem: 'Convite para iniciar MRPA exibido', status: 'lido' });
  if (error) throw traduzirErro(error);
}
