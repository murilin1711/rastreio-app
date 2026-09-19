import * as Notifications from 'expo-notifications';
import { agendarLembretesGlicemia, agendarLembretesMrpa, sincronizarLembretesMedicacao } from '@core/cardio/lembretesCardio';
import { sessaoAtiva } from '@core/cardio/sessoesMrpa';
import { agendarLembretesAgua } from '@core/bemestar/lembretesAgua';
import { listarMedicacoes } from '@core/medicacoes/repositorio';
import { obterPerfil, salvarPerfil } from '@core/perfil/repositorio';
import type { PreferenciasLembretes } from '@core/perfil/tipos';
import { montarContexto } from '@core/rastreando/contexto';
import { agendarLembretes } from '@core/rastreando/lembretes';
import { ROTULO_EXAME, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { agendarLembretesConsulta, listarConsultasFuturas } from './consultas';
import { PREFIXO_DO_TIPO, tiposParaCancelar, tiposParaReligar, type TipoLembrete } from './origem';
export { lerPreferencias } from './permissao';

/** Grava as preferências e aplica a diferença: desligar cancela só as notificações do celular; religar reagenda (D-010). */
export async function salvarPreferencias(userId: string, depois: PreferenciasLembretes): Promise<void> {
  const antes = (await obterPerfil(userId)).preferenciasLembretes;
  await salvarPerfil(userId, { preferenciasLembretes: depois });
  await aplicarPreferencias(userId, antes, depois);
}

export async function aplicarPreferencias(userId: string, antes: PreferenciasLembretes, depois: PreferenciasLembretes): Promise<void> {
  for (const tipo of tiposParaCancelar(antes, depois)) await silenciarTipo(userId, tipo);
  for (const tipo of tiposParaReligar(antes, depois)) await reagendarTipo(userId, tipo);
}

/** Cancela as notificações pendentes do tipo, mantém as linhas e marca ` silenciado` (o item continua visível no app). */
async function silenciarTipo(userId: string, tipo: TipoLembrete): Promise<void> {
  let q = supabase.from('lembretes').select('id, mensagem').eq('user_id', userId).eq('status', 'pendente');
  q = tipo === 'exame' ? q.eq('origem_tipo', 'exame') : q.like('titulo', `${PREFIXO_DO_TIPO[tipo]}%`);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  for (const l of data ?? []) {
    const notifId = l.mensagem?.match(/notif:([\w-]+)/)?.[1];
    if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
    const mensagem = `${(l.mensagem ?? '').replace(/\s*notif:[\w-]+/g, '').replace(/\s*silenciado$/, '')} silenciado`;
    const { error: e2 } = await supabase.from('lembretes').update({ mensagem }).eq('id', l.id);
    if (e2) throw traduzirErro(e2);
  }
}

/** Religar: chama os agendadores existentes, que já cancelam e recriam as linhas do tipo. */
async function reagendarTipo(userId: string, tipo: TipoLembrete): Promise<void> {
  switch (tipo) {
    case 'medicacao': {
      const ativas = (await listarMedicacoes(userId)).filter((m) => m.ativa && m.lembrar && m.horarios.length);
      await sincronizarLembretesMedicacao(userId, ativas);
      return;
    }
    case 'mrpa': {
      const s = await sessaoAtiva(userId);
      if (s) await agendarLembretesMrpa(userId, s);
      return;
    }
    case 'glicemia': {
      const perfil = await obterPerfil(userId);
      await agendarLembretesGlicemia(userId, perfil.planoGlicemia?.horarios ?? []);
      return;
    }
    case 'consulta': {
      for (const c of await listarConsultasFuturas(userId)) await agendarLembretesConsulta(userId, c);
      return;
    }
    case 'exame': {
      const ctx = await montarContexto(userId);
      const hoje = new Date().toISOString().slice(0, 10);
      const vistos = new Set<string>();
      for (const e of [...ctx.exames].sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao))) {
        if (vistos.has(e.programa) || !e.dataProximaAcao || e.dataProximaAcao < hoje) continue;
        vistos.add(e.programa);
        await agendarLembretes(userId, e.id, e.programa, e.dataProximaAcao, ROTULO_EXAME[e.tipo as TipoExameRastreamento] ?? e.tipo);
      }
      return;
    }
    case 'agua': {
      const perfil = await obterPerfil(userId);
      const temRestricao = perfil.temDoencaRenal === true || perfil.temInsuficienciaCardiaca === true;
      await agendarLembretesAgua(userId, perfil.lembretesAgua, temRestricao);
      return;
    }
    case 'atualizacao':
      return; // ainda não há agendador próprio; o item fica visível na Home pelo check-up
  }
}
