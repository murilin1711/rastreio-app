import type { ExameCardio } from './mapeamento';

export const fmtNum = (n: number) => String(n).replace('.', ',');

export function resumoResultadoExame(e: ExameCardio): string {
  const r = e.resultado;
  if (r.valor != null) return `${fmtNum(r.valor)} ${r.unidade ?? ''}`.trim();
  if (r.agatston != null) return `${r.agatston} Agatston${r.percentil != null ? ` · percentil ${r.percentil}` : ''}`;
  return r.conclusao ? r.conclusao : '—';
}
