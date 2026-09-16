import * as Notifications from 'expo-notifications';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

/** §38: 60, 30 e 7 dias antes; no dia; e 7 dias depois, caso o exame ainda não tenha sido registrado. */
const DIAS_ANTES = [60, 30, 7, 0, -7];

export async function pedirPermissaoNotificacoes(): Promise<boolean> {
  try {
    const atual = await Notifications.getPermissionsAsync();
    if (atual.status === 'granted') return true;
    const r = await Notifications.requestPermissionsAsync();
    return r.status === 'granted';
  } catch {
    return false;
  }
}

/** Cancela lembretes pendentes de um programa (um novo exame substitui o calendário anterior). */
export async function cancelarLembretesDoPrograma(userId: string, programa: string): Promise<void> {
  const { data, error } = await supabase
    .from('lembretes')
    .select('id, mensagem')
    .eq('user_id', userId)
    .eq('origem_tipo', 'exame')
    .eq('status', 'pendente')
    .like('titulo', `${programa}:%`);
  if (error) throw traduzirErro(error);
  for (const l of data ?? []) {
    const notifId = l.mensagem?.match(/notif:([\w-]+)/)?.[1];
    if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
  }
  const { error: e2 } = await supabase
    .from('lembretes')
    .update({ status: 'cancelado' })
    .eq('user_id', userId)
    .eq('origem_tipo', 'exame')
    .eq('status', 'pendente')
    .like('titulo', `${programa}:%`);
  if (e2) throw traduzirErro(e2);
}

function textoLembrete(dias: number, rotuloExame: string): string {
  if (dias > 0) return `Seu ${rotuloExame} está previsto para daqui a ${dias} dias.`;
  if (dias === 0) return `Hoje é a data prevista do seu ${rotuloExame}.`;
  return `Você já realizou seu ${rotuloExame}? Registre o resultado para manter seu acompanhamento atualizado.`;
}

export async function agendarLembretes(userId: string, exameId: string, programa: string, dataProxima: string, rotuloExame: string): Promise<void> {
  await cancelarLembretesDoPrograma(userId, programa);
  const temPermissao = await pedirPermissaoNotificacoes();
  const [a, m, d] = dataProxima.split('-').map(Number);

  for (const dias of DIAS_ANTES) {
    const quando = new Date(a, m - 1, d - dias, 9, 0, 0);
    if (quando.getTime() < Date.now()) continue;
    const texto = textoLembrete(dias, rotuloExame);
    let notifId: string | null = null;
    if (temPermissao) {
      notifId = await Notifications.scheduleNotificationAsync({
        content: { title: 'NERO — Rastreando', body: texto },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando },
      }).catch(() => null);
    }
    const { error } = await supabase.from('lembretes').insert({
      user_id: userId,
      origem_tipo: 'exame',
      origem_id: exameId,
      agendado_para: quando.toISOString(),
      titulo: `${programa}:${rotuloExame}`,
      mensagem: `${texto}${notifId ? ` notif:${notifId}` : ''}`,
    });
    if (error) throw traduzirErro(error);
  }
}
