import { mediaCircularHora } from './sono';
import type { Refeicao, TipoRefeicao } from './tipos';

export const ROTULO_REFEICAO: Record<TipoRefeicao, string> = { cafe: 'Café da manhã', lanche: 'Lanche', almoco: 'Almoço', lanche_tarde: 'Lanche da tarde', jantar: 'Jantar', ceia: 'Ceia', outra: 'Outra' };
const PRINCIPAIS = ['cafe', 'almoco', 'jantar'] as const;
type Principal = (typeof PRINCIPAIS)[number];
const SEMELHANTES_MAX_MIN = 45;
const VARIARAM_MIN = 90;

const p2 = (n: number) => String(n).padStart(2, '0');
const diaLocal = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const somarDias = (isoDia: string, n: number) => { const [a, m, d] = isoDia.split('-').map(Number); const x = new Date(a, m - 1, d + n); return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}`; };

export interface ResumoAlimentacao { diasComRegistro: number; totalRefeicoes: number; horarioMedio: Partial<Record<Principal, string>>; variacaoMin: Partial<Record<Principal, number>>; padrao: 'semelhantes' | 'variaram' | null; porDia: { dia: string; refeicoes: number }[] }

/**
 * §76: transforma o diário em resumo — dias registrados, horário médio (média circular) e variação (desvio-padrão em minutos)
 * das refeições principais. Linguagem neutra: nada de "bom/ruim".
 */
export function resumoAlimentacaoSemana(refeicoes: Refeicao[], semana: { inicio: string; fim: string }): ResumoAlimentacao {
  const na = refeicoes.filter((r) => { const d = diaLocal(r.em); return d >= semana.inicio && d <= semana.fim; });
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(semana.inicio, i));
  const horarioMedio: ResumoAlimentacao['horarioMedio'] = {};
  const variacaoMin: ResumoAlimentacao['variacaoMin'] = {};
  for (const tipo of PRINCIPAIS) {
    const hs = na.filter((r) => r.tipo === tipo).map((r) => { const d = new Date(r.em); return { h: d.getHours(), m: d.getMinutes() }; });
    if (!hs.length) continue;
    const media = mediaCircularHora(hs);
    horarioMedio[tipo] = `${p2(media.h)}:${p2(media.m)}`;
    const mediaMin = media.h * 60 + media.m;
    // desvio circular: diferença mínima no relógio de 24 h
    const desvios = hs.map(({ h, m }) => { let d = Math.abs(h * 60 + m - mediaMin); if (d > 720) d = 1440 - d; return d; });
    variacaoMin[tipo] = Math.round(Math.sqrt(desvios.reduce((s, d) => s + d * d, 0) / desvios.length));
  }
  const variacoes = Object.values(variacaoMin);
  const padrao = !variacoes.length ? null : variacoes.some((v) => v > VARIARAM_MIN) ? 'variaram' : variacoes.every((v) => v <= SEMELHANTES_MAX_MIN) ? 'semelhantes' : null;
  return {
    diasComRegistro: new Set(na.map((r) => diaLocal(r.em))).size,
    totalRefeicoes: na.length,
    horarioMedio, variacaoMin, padrao,
    porDia: dias.map((d) => ({ dia: d, refeicoes: na.filter((r) => diaLocal(r.em) === d).length })),
  };
}
