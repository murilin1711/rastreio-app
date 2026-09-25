/** Largura média de um caractere na fonte das células (Poppins 11). Arredondada para cima: sobrar é melhor que cortar. */
export const PX_POR_CARACTERE = 7;
const FOLGA = 10; // padding horizontal da célula
const TETO = 110;

const maiorPalavra = (t: string) => Math.max(0, ...t.split(/\s+/).map((p) => p.length));

/**
 * Largura de cada coluna: nunca menor que a maior palavra (não quebra "Medicamento" no meio) e, para
 * textos longos, até um teto, a partir do qual o texto quebra entre palavras.
 */
export function larguraColunas(colunas: string[], linhas: string[][]): number[] {
  return colunas.map((c, j) => {
    const celulas = [c, ...linhas.map((l) => l[j] ?? '')];
    const minimo = Math.max(...celulas.map(maiorPalavra)) * PX_POR_CARACTERE + FOLGA;
    const ideal = Math.max(...celulas.map((t) => t.length)) * PX_POR_CARACTERE + FOLGA;
    return Math.max(minimo, Math.min(ideal, TETO));
  });
}
