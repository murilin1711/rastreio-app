import { montarRelatorio } from '@core/regras/cardio/mrpa';
import type { MedidaPA, ParametrosPressao, RelatorioMrpa, SessaoMrpa } from '@core/regras/cardio/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { linhaParaSessao, type SessaoComResultado } from './mapeamento';

const CAMPOS = 'id, inicio, dias_previstos, status, horarios, pa_consultorio, resultado, concluida_em';
const hojeISO = () => new Date().toISOString().slice(0, 10);

export async function sessaoAtiva(userId: string): Promise<SessaoMrpa | null> {
  const { data, error } = await supabase.from('mrpa_sessoes').select(CAMPOS).eq('user_id', userId).eq('status', 'em_andamento').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw traduzirErro(error);
  return data ? linhaParaSessao(data) : null;
}

export async function listarSessoes(userId: string): Promise<SessaoComResultado[]> {
  const { data, error } = await supabase.from('mrpa_sessoes').select(CAMPOS).eq('user_id', userId).order('inicio', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map(linhaParaSessao);
}

export async function buscarSessao(userId: string, sessaoId: string): Promise<SessaoComResultado | null> {
  const { data, error } = await supabase.from('mrpa_sessoes').select(CAMPOS).eq('user_id', userId).eq('id', sessaoId).maybeSingle();
  if (error) throw traduzirErro(error);
  return data ? linhaParaSessao(data) : null;
}

export async function iniciarSessao(userId: string, e: { inicio: string; diasPrevistos: 4 | 5 | 6; horarios: SessaoMrpa['horarios']; paConsultorio: SessaoMrpa['paConsultorio'] }): Promise<SessaoMrpa> {
  const { data, error } = await supabase
    .from('mrpa_sessoes')
    .insert({
      user_id: userId,
      inicio: e.inicio,
      dias_previstos: e.diasPrevistos,
      horarios: e.horarios,
      pa_consultorio: e.paConsultorio ? { pas: e.paConsultorio.pas, pad: e.paConsultorio.pad, medido_em: e.paConsultorio.medidoEm } : null,
    })
    .select(CAMPOS)
    .single();
  if (error) throw traduzirErro(error);
  return linhaParaSessao(data);
}

/** Calcula o relatório (C-011) e o grava na sessão. */
export async function concluirSessao(userId: string, sessao: SessaoMrpa, medidas: MedidaPA[], p: ParametrosPressao): Promise<RelatorioMrpa> {
  const relatorio = montarRelatorio(sessao, medidas, p);
  const { error } = await supabase
    .from('mrpa_sessoes')
    .update({ status: 'concluida', fim: hojeISO(), concluida_em: new Date().toISOString(), resultado: JSON.parse(JSON.stringify(relatorio)) })
    .eq('id', sessao.id)
    .eq('user_id', userId);
  if (error) throw traduzirErro(error);
  return relatorio;
}

export async function cancelarSessao(userId: string, sessaoId: string): Promise<void> {
  const { error } = await supabase.from('mrpa_sessoes').update({ status: 'cancelada', fim: hojeISO() }).eq('id', sessaoId).eq('user_id', userId);
  if (error) throw traduzirErro(error);
}
