import * as Notifications from 'expo-notifications';
import { CANAL_LEMBRETES } from '@core/lembretes/configurar';
import { planejarLembretesMrpa } from '@core/regras/cardio/lembretesMrpa';
import type { SessaoMrpa } from '@core/regras/cardio/tipos';
import type { Medicacao } from '@core/medicacoes/tipos';
import { rotaTomar } from '@core/medicacoes/horarios';
import { formatarQuantidade } from '@core/medicacoes/unidades';
import { listarTomadas } from '@core/medicacoes/repositorio';
import { idSegundoLembrete, janelaSegundos, planejarSegundosLembretes, PREFIXO_SEGUNDO, vagasSegundos } from '@core/medicacoes/segundoLembrete';
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

type OrigemAgendada = 'medida' | 'medicacao' | 'consulta' | 'sistema';

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
export async function agendarDiario(userId: string, origemTipo: OrigemAgendada, origemId: string | null, chave: string, texto: TextoNotificacao, horario: string, temPermissao: boolean, rotaDoToque?: string): Promise<void> {
  const [hh, mm] = horario.split(':').map(Number);
  // A rota explícita é só para o toque; a Agenda continua usando `origemDe` (remédio → Meus remédios).
  const rota = rotaDoToque ?? origemDe({ origemTipo, titulo: chave, origemId }).rota;
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

/**
 * §21: um aviso diário por horário (D-048); a lista mostra os próximos 7 dias e `sincronizar` a renova ao abrir o app.
 * Spec de 23/11: o título leva a quantidade daquele horário e o toque abre a tela "Tomou?" da dose
 * (a data entra no toque, `rotaComData`). A chave continua `medicacao:<id>:<HH:MM>`.
 */
export async function agendarLembretesMedicacao(userId: string, m: Medicacao): Promise<void> {
  await cancelarLembretes(userId, `medicacao:${m.id}:`);
  const temPermissao = await notificacoesPermitidas(userId, 'medicacao');
  for (const h of m.horarios) {
    const texto = textoRemedio(m.nome, m.dose ?? null, m.doseVariavel ? null : formatarQuantidade(h.quantidade, m.unidade));
    await agendarDiario(userId, 'medicacao', m.id, `medicacao:${m.id}:${h.hora}`, texto, h.hora, temPermissao, rotaTomar(m.id, h.hora));
  }
}

/**
 * Chamada pela Home a cada abertura do app (`(tabs)/index.tsx`). É ela que, na primeira abertura
 * depois da atualização, troca os avisos antigos ("Hora de tomar seu remédio", que abriam Meus
 * medicamentos) pelos novos (spec §6.2): `agendarLembretesMedicacao` cancela pelo prefixo e reagenda.
 */
export async function sincronizarLembretesMedicacao(userId: string, ativasComLembrete: Medicacao[]): Promise<void> {
  for (const m of ativasComLembrete) await agendarLembretesMedicacao(userId, m);
  await sincronizarSegundosLembretes(userId, ativasComLembrete);
}

/**
 * Fila dos segundos lembretes (R-T5-a): a Home, `useMedicacoes` e a tela "Tomou?" podem mexer neles ao
 * mesmo tempo. Cada chamada espera a anterior terminar; assim uma sincronização com a lista velha não
 * agenda depois da nova, nem reagenda o aviso de uma dose que acabou de ser marcada.
 */
let fila: Promise<void> = Promise.resolve();
function naFila(tarefa: () => Promise<void>): Promise<void> {
  const vez = fila.then(tarefa);
  fila = vez.catch(() => {});
  return vez;
}

/** Cancela os segundos lembretes agendados e devolve quantos OUTROS avisos continuam no celular. */
async function cancelarSegundosAgendados(): Promise<number> {
  const agendados = await Notifications.getAllScheduledNotificationsAsync();
  let outros = 0;
  for (const n of agendados) {
    if (n.identifier.startsWith(PREFIXO_SEGUNDO)) await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    else outros++;
  }
  return outros;
}

/**
 * Segundo lembrete (spec §6.2): troca os avulsos `medicacao2:` agendados pelos da janela de hoje + amanhã
 * (mais o resto de ontem: a dose das 23:45 toca às 00:15). Passa pela fila (`naFila`).
 * A janela é de todos os remédios (por causa do teto), então quem chama passa a lista inteira.
 * As vagas são contadas aqui (R7): até 40 avulsos e nunca mais de 64 no total, somando os outros
 * avisos que já estão no celular — o iOS descarta o excedente sem erro, inclusive os principais.
 * Preferência "Medicamentos" desligada ou sem permissão: só cancela.
 */
export function sincronizarSegundosLembretes(userId: string, medicacoes: Medicacao[], agora: Date = new Date()): Promise<void> {
  return naFila(() => sincronizarAgora(userId, medicacoes, agora));
}

async function sincronizarAgora(userId: string, medicacoes: Medicacao[], agora: Date): Promise<void> {
  const outros = await cancelarSegundosAgendados();
  if (!(await notificacoesPermitidas(userId, 'medicacao'))) return;
  const [ontem, , amanha] = janelaSegundos(agora);
  let tomadas;
  try {
    tomadas = await listarTomadas(userId, ontem, amanha);
  } catch {
    // Sem as marcas, melhor nenhum segundo lembrete do que um para dose já marcada.
    return;
  }
  for (const s of planejarSegundosLembretes(medicacoes, tomadas, agora, vagasSegundos(outros))) {
    await Notifications.scheduleNotificationAsync({
      identifier: s.identificador,
      content: { title: tituloCompleto(s.texto), body: s.texto.corpo, data: { rota: s.rota } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: s.quando, channelId: CANAL_LEMBRETES },
    }).catch((e) => {
      console.warn('[lembretes] o sistema recusou o segundo lembrete', e);
    });
  }
}

/** Marcar a dose (tomei ou não tomei) cancela o segundo lembrete dela. */
export function cancelarSegundoLembrete(medicacaoId: string, data: string, hora: string): Promise<void> {
  return naFila(() => Notifications.cancelScheduledNotificationAsync(idSegundoLembrete(medicacaoId, data, hora)).catch(() => {}));
}

/** Preferência "Medicamentos" desligada: tira todos os segundos lembretes do celular. */
export function cancelarTodosSegundosLembretes(): Promise<void> {
  return naFila(async () => { await cancelarSegundosAgendados(); });
}

const ROTULO_MOMENTO: Record<string, string> = { jejum: 'em jejum', antes_cafe: 'antes do café', pos_cafe_1h: '1 h após o café', pos_cafe_2h: '2 h após o café', antes_almoco: 'antes do almoço', pos_almoco_1h: '1 h após o almoço', pos_almoco_2h: '2 h após o almoço', antes_jantar: 'antes do jantar', pos_jantar_1h: '1 h após o jantar', pos_jantar_2h: '2 h após o jantar', antes_dormir: 'antes de dormir', madrugada: 'de madrugada' };

/** §22: um aviso diário por horário do plano de glicemia (D-048). */
export async function agendarLembretesGlicemia(userId: string, horarios: { momento: string; hora: string }[]): Promise<void> {
  await cancelarLembretes(userId, 'glicemia:');
  if (!horarios.length) return;
  const temPermissao = await notificacoesPermitidas(userId, 'glicemia');
  for (const h of horarios) await agendarDiario(userId, 'medida', null, `glicemia:${h.momento}:${h.hora}`, textoGlicemia(ROTULO_MOMENTO[h.momento] ?? h.momento), h.hora, temPermissao);
}
