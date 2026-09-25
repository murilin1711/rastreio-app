import * as Notifications from 'expo-notifications';
import { CANAL_LEMBRETES } from '@core/lembretes/configurar';
import { notificacoesPermitidas, pedirPermissaoNotificacoes } from '@core/lembretes/permissao';
import { origemDe } from '@core/lembretes/origem';
import { mensagemDaLista, textoExameAntes, textoExameDepois, textoExameDia, tituloCompleto, type TextoNotificacao } from '@core/lembretes/textos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

export { pedirPermissaoNotificacoes };

/** §38: 60, 30 e 7 dias antes; no dia; e 7 dias depois, caso o exame ainda não tenha sido registrado. */
const DIAS_ANTES = [60, 30, 7, 0, -7];

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

/** Textos em `core/lembretes/textos.ts` (D-044): "exame" no título resolve o gênero de "seu mamografia". */
function textoLembrete(dias: number, rotuloExame: string): TextoNotificacao {
  if (dias > 0) return textoExameAntes(rotuloExame, dias);
  if (dias === 0) return textoExameDia(rotuloExame);
  return textoExameDepois(rotuloExame);
}

export async function agendarLembretes(userId: string, exameId: string, programa: string, dataProxima: string, rotuloExame: string): Promise<void> {
  await cancelarLembretesDoPrograma(userId, programa);
  const temPermissao = await notificacoesPermitidas(userId, 'exame');
  const [a, m, d] = dataProxima.split('-').map(Number);

  for (const dias of DIAS_ANTES) {
    const quando = new Date(a, m - 1, d - dias, 9, 0, 0);
    if (quando.getTime() < Date.now()) continue;
    const texto = textoLembrete(dias, rotuloExame);
    let notifId: string | null = null;
    if (temPermissao) {
      notifId = await Notifications.scheduleNotificationAsync({
        content: { title: tituloCompleto(texto), body: texto.corpo, data: { rota: origemDe({ origemTipo: 'exame', titulo: `${programa}:${rotuloExame}`, origemId: exameId }).rota } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando, channelId: CANAL_LEMBRETES },
      }).catch((e) => {
        // Se o sistema recusa o agendamento, a linha fica silenciada em vez de fingir que vai tocar.
        console.warn('[lembretes] o sistema recusou o agendamento', e);
        return null;
      });
    }
    const { error } = await supabase.from('lembretes').insert({
      user_id: userId,
      origem_tipo: 'exame',
      origem_id: exameId,
      agendado_para: quando.toISOString(),
      titulo: `${programa}:${rotuloExame}`,
      mensagem: `${mensagemDaLista(texto)}${notifId ? ` notif:${notifId}` : ' silenciado'}`,
    });
    if (error) throw traduzirErro(error);
  }
}
