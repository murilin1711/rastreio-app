/**
 * Ingestão de água (D-016, parte D / C-021).
 *
 * A meta é de **água bebida**, não de água total: o usuário não tem como estimar a água que vem
 * dos alimentos, e as diretrizes que dão números (EFSA 2010, IOM 2005) são de água total, o que as
 * torna incomparáveis com copos. Ver `docs/nero/referencias/agua.md` para o levantamento completo.
 *
 * O parâmetro de 35 ml/kg/dia é regra de cálculo de necessidade hídrica usada em nutrição clínica
 * — não é recomendação populacional de diretriz. Adotado por decisão do Murilo em 19/09/2026.
 */
const ML_POR_KG = 35;

/**
 * Meta diária sugerida, arredondada para 50 ml. Devolve `null` quando não há peso registrado e,
 * principalmente, quando a pessoa tem restrição hídrica (doença renal ou insuficiência cardíaca):
 * nesses casos o volume é conduta médica e o app não calcula nada.
 */
export function metaSugeridaMl(pesoKg: number | null, temRestricao: boolean): number | null {
  if (temRestricao || pesoKg == null || pesoKg <= 0) return null;
  return Math.round((pesoKg * ML_POR_KG) / 50) * 50;
}

/** Soma dos registros do dia informado (data local, no formato AAAA-MM-DD). */
export function totalDoDiaMl(registros: { medidoEm: string; ml: number }[], dia: string): number {
  return registros.filter((r) => r.medidoEm.slice(0, 10) === dia).reduce((soma, r) => soma + r.ml, 0);
}

/**
 * Se a meta do dia acabou de ser batida e ainda não foi comemorada hoje. A comemoração é **diária**
 * (decisão do Murilo em 19/09/2026): repete todo dia em que a pessoa bate a meta, mas só uma vez por dia.
 */
export function deveComemorarMeta(totalMl: number, metaMl: number | null, comemoradaEm: string | null, hoje: string): boolean {
  if (metaMl == null || metaMl <= 0) return false;
  return totalMl >= metaMl && comemoradaEm !== hoje;
}
