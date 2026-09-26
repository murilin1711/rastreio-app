import { semanaDoCheckin } from './checkin';

/**
 * Avisos do check-in semanal (D-060, decisão do Murilo em 26/09): domingo às 10h e, para quem ainda não
 * respondeu, terça às 19h, último dia da janela. Domingo e terça avaliam a mesma semana (`semanaDoCheckin`),
 * então a chave carrega a semana: responder cancela o que sobrou dela. Quatro semanas à frente, renovadas
 * ao abrir o app, ocupam 8 das 64 vagas de notificação do iOS.
 */
export interface LembreteCheckinPlanejado { chave: string; quando: Date; periodo: 'domingo' | 'terca' }

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const SEMANAS = 4;

export function planejarLembretesCheckin(agora: Date, semanasRespondidas: string[]): LembreteCheckinPlanejado[] {
  // Domingo desta janela: o da semana corrente se hoje é segunda ou terça, senão o próximo.
  const dow = agora.getDay();
  const recuo = dow === 1 ? 1 : dow === 2 ? 2 : 0;
  const avanco = recuo ? -recuo : (7 - dow) % 7;
  const base = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + avanco);
  const plano: LembreteCheckinPlanejado[] = [];
  for (let s = 0; s < SEMANAS; s++) {
    const domingo = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7 * s, 10, 0, 0);
    const terca = new Date(domingo.getFullYear(), domingo.getMonth(), domingo.getDate() + 2, 19, 0, 0);
    const semana = semanaDoCheckin(iso(domingo));
    if (semanasRespondidas.includes(semana)) continue;
    for (const [quando, periodo] of [[domingo, 'domingo'], [terca, 'terca']] as const) {
      if (quando.getTime() > agora.getTime()) plano.push({ chave: `checkin:${semana}:${periodo === 'domingo' ? 'dom' : 'ter'}`, quando, periodo });
    }
  }
  return plano;
}
