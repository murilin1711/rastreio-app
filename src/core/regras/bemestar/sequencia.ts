/**
 * Sequência de dias com registro (D-016, parte C). Conta dias, nunca eventos nomeados: a mensagem
 * jamais cita o que foi registrado, para não transformar "registrei minha mamografia" em conquista.
 * Quebrar a sequência não gera aviso nem perda — ela só recomeça, e o total da vida continua.
 */
export type MarcoSequencia = 3 | 7 | 30 | 100;

export const MARCOS_SEQUENCIA: MarcoSequencia[] = [3, 7, 30, 100];

const DIA_MS = 86_400_000;
const paraDia = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DIA_MS;

/**
 * `sequencia` = dias consecutivos terminando hoje ou ontem — quem registrou ontem e ainda não
 * registrou hoje segue com a sequência viva pelo dia inteiro. `total` = dias distintos com registro.
 */
export function resumoSequencia(dias: string[], hoje: string): { sequencia: number; total: number } {
  const unicos = [...new Set(dias)].map(paraDia).sort((a, b) => b - a);
  const h = paraDia(hoje);
  if (unicos.length === 0 || unicos[0] < h - 1) return { sequencia: 0, total: unicos.length };
  let sequencia = 1;
  for (let i = 1; i < unicos.length && unicos[i - 1] - unicos[i] === 1; i++) sequencia++;
  return { sequencia, total: unicos.length };
}

/** O marco a comemorar agora, ou `null` se não houver um maior que o já comemorado. */
export function marcoSequencia(sequencia: number, jaComemorado: number): MarcoSequencia | null {
  const alcancado = [...MARCOS_SEQUENCIA].reverse().find((m) => sequencia >= m);
  return alcancado != null && alcancado > jaComemorado ? alcancado : null;
}
