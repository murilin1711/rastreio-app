import * as Notifications from 'expo-notifications';
import { planejarLembretesMrpa } from '@core/regras/cardio/lembretesMrpa';
import type { SessaoMrpa } from '@core/regras/cardio/tipos';
import { pedirPermissaoNotificacoes } from '@core/rastreando/lembretes';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

/** Mesmo esquema de `rastreando/lembretes.ts`: notificação local + linha em `lembretes` com `notif:<id>` na mensagem. */
async function agendar(userId: string, origemTipo: 'medida' | 'medicacao', origemId: string | null, titulo: string, texto: string, quando: Date, temPermissao: boolean): Promise<void> {
  if (quando.getTime() < Date.now()) return;
  let notifId: string | null = null;
  if (temPermissao) {
    notifId = await Notifications.scheduleNotificationAsync({
      content: { title: 'NERO — Coração & Metabolismo', body: texto },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando },
    }).catch(() => null);
  }
  const { error } = await supabase.from('lembretes').insert({
    user_id: userId,
    origem_tipo: origemTipo,
    origem_id: origemId,
    agendado_para: quando.toISOString(),
    titulo,
    mensagem: `${texto}${notifId ? ` notif:${notifId}` : ''}`,
  });
  if (error) throw traduzirErro(error);
}

/** Cancela (notificação + linha) todos os lembretes pendentes cujo título começa com o prefixo. */
export async function cancelarLembretes(userId: string, prefixoTitulo: string): Promise<void> {
  const { data, error } = await supabase.from('lembretes').select('id, mensagem').eq('user_id', userId).eq('status', 'pendente').like('titulo', `${prefixoTitulo}%`);
  if (error) throw traduzirErro(error);
  for (const l of data ?? []) {
    const notifId = l.mensagem?.match(/notif:([\w-]+)/)?.[1];
    if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
  }
  const { error: e2 } = await supabase.from('lembretes').update({ status: 'cancelado' }).eq('user_id', userId).eq('status', 'pendente').like('titulo', `${prefixoTitulo}%`);
  if (e2) throw traduzirErro(e2);
}

export async function agendarLembretesMrpa(userId: string, sessao: SessaoMrpa): Promise<void> {
  await cancelarLembretes(userId, `mrpa:${sessao.id}:`);
  const temPermissao = await pedirPermissaoNotificacoes();
  for (const l of planejarLembretesMrpa(sessao)) await agendar(userId, 'medida', sessao.id, l.titulo, l.texto, l.quando, temPermissao);
}

/** §21: um lembrete por horário para os próximos 7 dias; `sincronizar` reagenda ao abrir o app. */
export async function agendarLembretesMedicacao(userId: string, m: { id: string; nome: string; horarios: string[] }): Promise<void> {
  await cancelarLembretes(userId, `medicacao:${m.id}:`);
  const temPermissao = await pedirPermissaoNotificacoes();
  const hoje = new Date();
  for (let d = 0; d < 7; d++) {
    for (const h of m.horarios) {
      const [hh, mm] = h.split(':').map(Number);
      const quando = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + d, hh, mm, 0);
      await agendar(userId, 'medicacao', m.id, `medicacao:${m.id}:${h}`, `Hora do seu medicamento: ${m.nome}.`, quando, temPermissao);
    }
  }
}

export async function sincronizarLembretesMedicacao(userId: string, ativasComLembrete: { id: string; nome: string; horarios: string[] }[]): Promise<void> {
  for (const m of ativasComLembrete) await agendarLembretesMedicacao(userId, m);
}
