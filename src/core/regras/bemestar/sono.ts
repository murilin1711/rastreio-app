import type { RegraParametros } from '../tipos';
import type { ParametrosBemEstar, Sono } from './tipos';

const MAX_MIN = 20 * 60;
const p2 = (n: number) => String(n).padStart(2, '0');
const diaLocal = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };

/** Minutos entre dormir e acordar. Lança se acordou antes de dormir ou se passou de 20 h (registro implausível). */
export function minutosDeSono(dormiuEm: string, acordouEm: string): number {
  const min = Math.round((Date.parse(acordouEm) - Date.parse(dormiuEm)) / 60_000);
  if (min <= 0 || min > MAX_MIN) throw new Error('Horários de sono implausíveis');
  return min;
}

export function formatarHm(min: number): string { return `${Math.floor(min / 60)}h${p2(min % 60)}`; }

/** Média circular (ângulos no relógio de 24 h): 23:40 e 00:20 → 00:00, não 12:00 (spec §10). */
export function mediaCircularHora(horas: { h: number; m: number }[]): { h: number; m: number } {
  const ang = horas.map(({ h, m }) => ((h * 60 + m) / 1440) * 2 * Math.PI);
  const x = ang.reduce((s, a) => s + Math.cos(a), 0) / ang.length;
  const y = ang.reduce((s, a) => s + Math.sin(a), 0) / ang.length;
  let media = Math.atan2(y, x); if (media < 0) media += 2 * Math.PI;
  const total = Math.round((media / (2 * Math.PI)) * 1440) % 1440;
  return { h: Math.floor(total / 60), m: total % 60 };
}

export interface ResumoSono { noites: number; mediaMin: number | null; horarioDormir: string | null; horarioAcordar: string | null; abaixoDaReferencia: boolean; regra: RegraParametros; porNoite: { data: string; minutos: number; qualidade: number | null }[] }

/** §80 "Média dos últimos 7 dias": noites cujo despertar cai nos últimos 7 dias (inclusive hoje). */
export function resumo7d(sonos: Sono[], hoje: string, p: ParametrosBemEstar): ResumoSono {
  const [a, m, d] = hoje.slice(0, 10).split('-').map(Number);
  const limite = new Date(a, m - 1, d - 6);
  const desde = `${limite.getFullYear()}-${p2(limite.getMonth() + 1)}-${p2(limite.getDate())}`;
  const na = sonos.filter((s) => { const dia = diaLocal(s.acordouEm); return dia >= desde && dia <= hoje.slice(0, 10); }).sort((x, y) => x.acordouEm.localeCompare(y.acordouEm));
  if (!na.length) return { noites: 0, mediaMin: null, horarioDormir: null, horarioAcordar: null, abaixoDaReferencia: false, regra: p.sono.regra, porNoite: [] };
  const hm = (iso: string) => { const dt = new Date(iso); return { h: dt.getHours(), m: dt.getMinutes() }; };
  const dormir = mediaCircularHora(na.map((s) => hm(s.dormiuEm)));
  const acordar = mediaCircularHora(na.map((s) => hm(s.acordouEm)));
  const mediaMin = Math.round(na.reduce((s, x) => s + x.minutos, 0) / na.length);
  return {
    noites: na.length, mediaMin,
    horarioDormir: `${p2(dormir.h)}:${p2(dormir.m)}`, horarioAcordar: `${p2(acordar.h)}:${p2(acordar.m)}`,
    abaixoDaReferencia: mediaMin < p.sono.minimoMin, regra: p.sono.regra,
    porNoite: na.map((s) => ({ data: diaLocal(s.acordouEm), minutos: s.minutos, qualidade: s.qualidade })),
  };
}
