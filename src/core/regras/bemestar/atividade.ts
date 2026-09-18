import type { Atividade, Meta, ParametrosBemEstar, TipoAtividade } from './tipos';

export const TIPOS_FORTALECIMENTO: TipoAtividade[] = ['musculacao', 'funcional', 'pilates'];
export const ROTULO_ATIVIDADE: Record<TipoAtividade, string> = { caminhada: 'Caminhada', corrida: 'Corrida', ciclismo: 'Ciclismo', musculacao: 'Musculação', natacao: 'Natação', esporte_coletivo: 'Esporte coletivo', danca: 'Dança', funcional: 'Funcional', pilates: 'Pilates', yoga: 'Yoga', outra: 'Outra' };

const dia = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const somarDias = (isoDia: string, n: number) => { const [a, m, d] = isoDia.split('-').map(Number); const x = new Date(a, m - 1, d + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

/** Semana de segunda a domingo (local) que contém a data. */
export function semanaDe(isoDia: string): { inicio: string; fim: string } {
  const [a, m, d] = isoDia.slice(0, 10).split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  const desdeSegunda = (dt.getDay() + 6) % 7;
  const inicio = somarDias(isoDia.slice(0, 10), -desdeSegunda);
  return { inicio, fim: somarDias(inicio, 6) };
}

/** OMS 2020: minutos moderados + vigorosos × fator (1 min vigoroso = 2 moderados). Leve não conta para a meta. */
export function minutosQueContam(a: Atividade[], p: ParametrosBemEstar): number {
  return a.reduce((s, x) => s + (x.intensidade === 'moderada' ? x.duracaoMin : x.intensidade === 'vigorosa' ? x.duracaoMin * p.atividade.fatorVigorosa : 0), 0);
}

export interface ResumoSemana { totalMin: number; leveMin: number; moderadaMin: number; vigorosaMin: number; minutosQueContam: number; diasAtivos: number; diasFortalecimento: number; porDia: { dia: string; minutos: number }[]; metaMin: number; metaAtingidaPct: number; fortalecimentoMeta: number; idoso: boolean; equilibrioDias: number }

/** §78 "Sua semana" + progresso da meta (§79, C-017). `meta` = meta ativa de `atividade_min`, ou null para a sugerida. */
export function resumoSemana(a: Atividade[], semana: { inicio: string; fim: string }, p: ParametrosBemEstar, idade: number | null, meta: Meta | null): ResumoSemana {
  const na = a.filter((x) => { const d = dia(x.inicio); return d >= semana.inicio && d <= semana.fim; });
  const soma = (i: Atividade['intensidade']) => na.filter((x) => x.intensidade === i).reduce((s, x) => s + x.duracaoMin, 0);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(semana.inicio, i));
  const porDia = dias.map((d) => ({ dia: d, minutos: na.filter((x) => dia(x.inicio) === d).reduce((s, x) => s + x.duracaoMin, 0) }));
  const contam = minutosQueContam(na, p);
  const metaMin = meta?.tipo === 'atividade_min' ? meta.valor : p.atividade.moderadaMin;
  const idoso = idade != null && idade >= p.atividade.idosoIdade;
  return {
    totalMin: na.reduce((s, x) => s + x.duracaoMin, 0), leveMin: soma('leve'), moderadaMin: soma('moderada'), vigorosaMin: soma('vigorosa'),
    minutosQueContam: contam,
    diasAtivos: new Set(na.map((x) => dia(x.inicio))).size,
    diasFortalecimento: new Set(na.filter((x) => TIPOS_FORTALECIMENTO.includes(x.tipo)).map((x) => dia(x.inicio))).size,
    porDia, metaMin, metaAtingidaPct: Math.min(100, Math.round((contam / metaMin) * 100)),
    fortalecimentoMeta: p.atividade.fortalecimentoDias, idoso, equilibrioDias: idoso ? p.atividade.equilibrioDias : 0,
  };
}

/** §78 "Últimos 30 dias": sessões e minutos por tipo, mais minutos primeiro. */
export function resumo30d(a: Atividade[], hoje: string): { porTipo: { tipo: TipoAtividade; sessoes: number; minutos: number }[]; totalMin: number } {
  const desde = somarDias(hoje.slice(0, 10), -30);
  const na = a.filter((x) => dia(x.inicio) >= desde && dia(x.inicio) <= hoje.slice(0, 10));
  const mapa = new Map<TipoAtividade, { sessoes: number; minutos: number }>();
  for (const x of na) { const c = mapa.get(x.tipo) ?? { sessoes: 0, minutos: 0 }; mapa.set(x.tipo, { sessoes: c.sessoes + 1, minutos: c.minutos + x.duracaoMin }); }
  const porTipo = [...mapa.entries()].map(([tipo, v]) => ({ tipo, ...v })).sort((x, y) => y.minutos - x.minutos);
  return { porTipo, totalMin: na.reduce((s, x) => s + x.duracaoMin, 0) };
}
