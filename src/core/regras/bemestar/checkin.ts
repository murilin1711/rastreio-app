import { semanaDe } from './atividade';
import type { Checkin } from './tipos';

const p2 = (n: number) => String(n).padStart(2, '0');
const somarDias = (isoDia: string, n: number) => { const [a, m, d] = isoDia.split('-').map(Number); const x = new Date(a, m - 1, d + n); return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}`; };

/** Semana (segunda-feira) que o check-in de hoje avalia: a anterior, exceto no domingo, que avalia a atual (§86). */
export function semanaDoCheckin(hoje: string): string {
  const [a, m, d] = hoje.slice(0, 10).split('-').map(Number);
  const dow = new Date(a, m - 1, d).getDay();
  const atual = semanaDe(hoje).inicio;
  return dow === 0 ? atual : somarDias(atual, -7);
}

/** Pendente quando a semana avaliável não tem check-in e hoje está na janela de resposta (domingo, segunda ou terça). */
export function checkinPendente(checkins: Checkin[], hoje: string): boolean {
  const [a, m, d] = hoje.slice(0, 10).split('-').map(Number);
  const dow = new Date(a, m - 1, d).getDay();
  if (![0, 1, 2].includes(dow)) return false;
  const alvo = semanaDoCheckin(hoje);
  return !checkins.some((c) => c.semana === alvo);
}

const media = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x != null); return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : null; };

/** §87: médias mensais de energia, estresse e bem-estar, mais recente primeiro. */
export function mediasMensais(checkins: Checkin[]): { mes: string; energia: number | null; estresse: number | null; bemEstar: number | null; n: number }[] {
  const grupos = new Map<string, Checkin[]>();
  for (const c of checkins) { const mes = c.semana.slice(0, 7); grupos.set(mes, [...(grupos.get(mes) ?? []), c]); }
  return [...grupos.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([mes, cs]) => ({ mes, energia: media(cs.map((c) => c.energia)), estresse: media(cs.map((c) => c.estresse)), bemEstar: media(cs.map((c) => c.bemEstar)), n: cs.length }));
}
