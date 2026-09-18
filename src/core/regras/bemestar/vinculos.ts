import type { Atividade, ParametrosBemEstar, Refeicao } from './tipos';

export interface Vinculo { glicemiaId: string; refeicaoId: string | null; atividadeId: string | null }

/**
 * C-020: candidatos a vínculo para uma glicemia — a refeição mais recente nas últimas `horas`
 * e a atividade mais recente que **terminou** nas últimas `horas` (e começou antes da medida).
 * O usuário confirma; nada é vinculado automaticamente.
 */
export function candidatosVinculo(glicemia: { medidoEm: string }, refeicoes: Refeicao[], atividades: Atividade[], p: ParametrosBemEstar): { refeicao: Refeicao | null; atividade: Atividade | null } {
  const t = Date.parse(glicemia.medidoEm);
  const janela = p.vinculo.horas * 3_600_000;
  const refeicao = refeicoes.filter((r) => { const em = Date.parse(r.em); return em <= t && t - em <= janela; }).sort((a, b) => b.em.localeCompare(a.em))[0] ?? null;
  const atividade = atividades.filter((a) => { const ini = Date.parse(a.inicio); const fim = ini + a.duracaoMin * 60_000; return ini < t && fim <= t && t - fim <= janela; }).sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null;
  return { refeicao, atividade };
}
