import * as Notifications from 'expo-notifications';
import { CANAL_LEMBRETES } from '@core/lembretes/configurar';
import { planejarLembretesMrpa } from '@core/regras/cardio/lembretesMrpa';
import type { SessaoMrpa } from '@core/regras/cardio/tipos';
import { notificacoesPermitidas } from '@core/lembretes/permissao';
import { origemDe } from '@core/lembretes/origem';
import { mensagemDaLista, textoGlicemia, textoMrpa, textoRemedio, tituloCompleto, type TextoNotificacao } from '@core/lembretes/textos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

/** Pede o aviso ao sistema; se ele recusa, devolve `null` e a linha fica silenciada (D-047). */
async function pedirAoSistema(content: Notifications.NotificationContentInput, trigger: Notifications.NotificationTriggerInput): Promise<string | null> {
  return Notifications.scheduleNotificationAsync({ content, trigger }).catch((e) => {
    // Se o sistema recusa o agendamento, a linha fica silenciada em vez de fingir que vai tocar.
    console.warn('[lembretes] o sistema recusou o agendamento', e);
    return null;
  });
}

async function gravarLinha(userId: string, origemTipo: OrigemAgendada, origemId: string | null, chave: string, texto: TextoNotificacao, quando: Date, notifId: string | null): Promise<void> {
  const { error } = await supabase.from('lembretes').insert({
    user_id: userId,
    origem_tipo: origemTipo,
    origem_id: origemId,
    agendado_para: quando.toISOString(),
    titulo: chave,
    mensagem: `${mensagemDaLista(texto)}${notifId ? ` notif:${notifId}` : ' silenciado'}`,
  });
  if (error) throw traduzirErro(error);
}

type OrigemAgendada = 'medida' | 'medicacao' | 'consulta';

/**
 * Mesmo esquema de `rastreando/lembretes.ts`: notificação local + linha em `lembretes` com `notif:<id>` na mensagem.
 * `chave` é o `lembretes.titulo` (ex.: `consulta:<id>:1d`), que identifica o lembrete; o texto que a
 * pessoa lê vem de `textos.ts` (D-044). A rota vai no `data` para o toque abrir a tela certa.
 */
export async function agendar(userId: string, origemTipo: OrigemAgendada, origemId: string | null, chave: string, texto: TextoNotificacao, quando: Date, temPermissao: boolean): Promise<void> {
  if (quando.getTime() < Date.now()) return;
  const rota = origemDe({ origemTipo, titulo: chave, origemId }).rota;
  const notifId = temPermissao
    ? await pedirAoSistema({ title: tituloCompleto(texto), body: texto.corpo, data: { rota } }, { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando, channelId: CANAL_LEMBRETES })
    : null;
  await gravarLinha(userId, origemTipo, origemId, chave, texto, quando, notifId);
}

/**
 * D-048: o que se repete todo dia (remédio, glicemia, água) vira **um** aviso diário no sistema, não um
 * por dia. O iOS guarda no máximo 64 agendados por app e descarta o excedente sem erro; com um aviso por
 * dia durante 7 dias, três remédios 2×/dia já ocupavam 42. As linhas da lista continuam sendo 7 dias à
 * frente, todas com o id do mesmo aviso, para a lista e o cancelamento funcionarem como antes.
 */
export async function agendarDiario(userId: string, origemTipo: OrigemAgendada, origemId: string | null, chave: string, texto: TextoNotificacao, horario: string, temPermissao: boolean): Promise<void> {
  const [hh, mm] = horario.split(':').map(Number);
  const rota = origemDe({ origemTipo, titulo: chave, origemId }).rota;
  const notifId = temPermissao
    ? await pedirAoSistema({ title: tituloCompleto(texto), body: texto.corpo, data: { rota } }, { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hh, minute: mm, channelId: CANAL_LEMBRETES })
    : null;
  const hoje = new Date();
  for (let d = 0; d < 7; d++) {
    const quando = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + d, hh, mm, 0);
    if (quando.getTime() >= Date.now()) await gravarLinha(userId, origemTipo, origemId, chave, texto, quando, notifId);
  }
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
  const temPermissao = await notificacoesPermitidas(userId, 'mrpa');
  for (const l of planejarLembretesMrpa(sessao)) await agendar(userId, 'medida', sessao.id, l.titulo, textoMrpa(l.dia, sessao.diasPrevistos, l.periodo), l.quando, temPermissao);
}

/** §21: um aviso diário por horário (D-048); a lista mostra os próximos 7 dias e `sincronizar` a renova ao abrir o app. */
export async function agendarLembretesMedicacao(userId: string, m: { id: string; nome: string; dose?: string | null; horarios: string[] }): Promise<void> {
  await cancelarLembretes(userId, `medicacao:${m.id}:`);
  const temPermissao = await notificacoesPermitidas(userId, 'medicacao');
  for (const h of m.horarios) await agendarDiario(userId, 'medicacao', m.id, `medicacao:${m.id}:${h}`, textoRemedio(m.nome, m.dose ?? null), h, temPermissao);
}

export async function sincronizarLembretesMedicacao(userId: string, ativasComLembrete: { id: string; nome: string; dose?: string | null; horarios: string[] }[]): Promise<void> {
  for (const m of ativasComLembrete) await agendarLembretesMedicacao(userId, m);
}

const ROTULO_MOMENTO: Record<string, string> = { jejum: 'em jejum', antes_cafe: 'antes do café', pos_cafe_1h: '1 h após o café', pos_cafe_2h: '2 h após o café', antes_almoco: 'antes do almoço', pos_almoco_1h: '1 h após o almoço', pos_almoco_2h: '2 h após o almoço', antes_jantar: 'antes do jantar', pos_jantar_1h: '1 h após o jantar', pos_jantar_2h: '2 h após o jantar', antes_dormir: 'antes de dormir', madrugada: 'de madrugada' };

/** §22: um aviso diário por horário do plano de glicemia (D-048). */
export async function agendarLembretesGlicemia(userId: string, horarios: { momento: string; hora: string }[]): Promise<void> {
  await cancelarLembretes(userId, 'glicemia:');
  if (!horarios.length) return;
  const temPermissao = await notificacoesPermitidas(userId, 'glicemia');
  for (const h of horarios) await agendarDiario(userId, 'medida', null, `glicemia:${h.momento}:${h.hora}`, textoGlicemia(ROTULO_MOMENTO[h.momento] ?? h.momento), h.hora, temPermissao);
}
