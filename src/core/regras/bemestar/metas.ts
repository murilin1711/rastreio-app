/**
 * Progresso e marcos de metas de peso e cintura (D-016).
 * O marco é comemorado uma vez só e nunca é retirado: se a pessoa se afastar de novo do alvo,
 * o app não avisa nem "desfaz" a conquista.
 */

/** Marcos comemorados, em % do caminho entre o ponto de partida e o alvo. */
export type Marco = 50 | 100;

/**
 * Quanto do caminho entre `inicial` (valor no dia em que a meta foi criada) e `alvo` já foi percorrido.
 * A mesma fórmula serve para reduzir e para ganhar peso. Passar do alvo dá mais de 1; andar para o
 * lado contrário dá negativo. Devolve `null` quando não há partida registrada ou ela é igual ao alvo.
 */
export function progressoMeta(inicial: number | null, alvo: number, atual: number): number | null {
  if (inicial == null || inicial === alvo) return null;
  return Math.round(((inicial - atual) / (inicial - alvo)) * 1e4) / 1e4;
}

/** O marco a comemorar agora, ou `null` se não houver um maior que o já comemorado. */
export function marcoNovo(progresso: number | null, jaComemorado: number): Marco | null {
  if (progresso == null) return null;
  const marco: number = progresso >= 1 ? 100 : progresso >= 0.5 ? 50 : 0;
  return marco > jaComemorado ? (marco as Marco) : null;
}
