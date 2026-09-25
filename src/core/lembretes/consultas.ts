import { agendar, cancelarLembretes } from '@core/cardio/lembretesCardio';
import { rotuloEspecialidade } from '@core/relatorios/especialidades';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { notificacoesPermitidas } from './permissao';
import { textoConsultaDia, textoConsultaVespera } from './textos';
import type { Consulta } from './tipos';

const CAMPOS = 'id, especialidade, data_hora, local, profissional, observacao';
type Linha = { id: string; especialidade: string; data_hora: string; local: string | null; profissional: string | null; observacao: string | null };
const paraConsulta = (l: Linha): Consulta => ({ id: l.id, especialidade: l.especialidade as Consulta['especialidade'], dataHora: l.data_hora, local: l.local, profissional: l.profissional, observacao: l.observacao });

export async function listarConsultas(userId: string): Promise<Consulta[]> {
  const { data, error } = await supabase.from('consultas').select(CAMPOS).eq('user_id', userId).order('data_hora', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map(paraConsulta);
}

export async function listarConsultasFuturas(userId: string): Promise<Consulta[]> {
  const { data, error } = await supabase.from('consultas').select(CAMPOS).eq('user_id', userId).gte('data_hora', new Date().toISOString()).order('data_hora');
  if (error) throw traduzirErro(error);
  return data.map(paraConsulta);
}

export async function salvarConsulta(userId: string, c: Omit<Consulta, 'id'> & { id?: string }): Promise<Consulta> {
  const linha = { user_id: userId, especialidade: c.especialidade, data_hora: c.dataHora, local: c.local, profissional: c.profissional, observacao: c.observacao };
  const q = c.id ? supabase.from('consultas').update(linha).eq('user_id', userId).eq('id', c.id) : supabase.from('consultas').insert(linha);
  const { data, error } = await q.select(CAMPOS).single();
  if (error) throw traduzirErro(error);
  const salva = paraConsulta(data);
  await agendarLembretesConsulta(userId, salva);
  return salva;
}

export async function excluirConsulta(userId: string, id: string): Promise<void> {
  await cancelarLembretesConsulta(userId, id);
  const { error } = await supabase.from('consultas').delete().eq('user_id', userId).eq('id', id);
  if (error) throw traduzirErro(error);
}

const hora = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

/** D-010: véspera às 09:00 com convite para preparar o relatório; no dia às 07:00. */
export async function agendarLembretesConsulta(userId: string, c: Consulta): Promise<void> {
  await cancelarLembretesConsulta(userId, c.id);
  const temPermissao = await notificacoesPermitidas(userId, 'consulta');
  const dt = new Date(c.dataHora);
  const esp = rotuloEspecialidade(c.especialidade);
  const vespera = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 1, 9, 0, 0);
  const dia = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 7, 0, 0);
  await agendar(userId, 'consulta', c.id, `consulta:${c.id}:vespera`, textoConsultaVespera(esp, hora(c.dataHora)), vespera, temPermissao);
  await agendar(userId, 'consulta', c.id, `consulta:${c.id}:dia`, textoConsultaDia(esp, hora(c.dataHora), c.local), dia, temPermissao);
}

export async function cancelarLembretesConsulta(userId: string, consultaId: string): Promise<void> {
  await cancelarLembretes(userId, `consulta:${consultaId}:`);
}
