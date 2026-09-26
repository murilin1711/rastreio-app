import { agendar, cancelarLembretes } from '@core/cardio/lembretesCardio';
import { notificacoesPermitidas } from '@core/lembretes/permissao';
import { textoCheckinDomingo, textoCheckinTerca } from '@core/lembretes/textos';
import { planejarLembretesCheckin } from '@core/regras/bemestar/lembretesCheckin';
import { listarCheckins } from './checkins';

/** D-060: refaz os avisos das próximas 4 semanas, pulando as já respondidas. Renovado ao abrir o app. */
export async function agendarLembretesCheckin(userId: string): Promise<void> {
  await cancelarLembretes(userId, 'checkin:');
  const [temPermissao, checkins] = await Promise.all([notificacoesPermitidas(userId, 'checkin'), listarCheckins(userId)]);
  const plano = planejarLembretesCheckin(new Date(), checkins.map((c) => c.semana));
  for (const l of plano) {
    await agendar(userId, 'sistema', null, l.chave, l.periodo === 'domingo' ? textoCheckinDomingo() : textoCheckinTerca(), l.quando, temPermissao);
  }
}

/** Respondeu: cancela o que sobrou daquela semana (o aviso de terça). */
export async function aoResponderCheckin(userId: string, semana: string): Promise<void> {
  await cancelarLembretes(userId, `checkin:${semana}:`);
}
