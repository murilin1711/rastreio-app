/** Linha do tempo geral (§60): itens de todos os módulos, agrupados por ano, mais recentes primeiro. Puro. */
export type ModuloItem = 'cardio' | 'rastreando' | 'medicacao' | 'consulta' | 'documento' | 'bem_estar';
export interface ItemGeral { data: string; modulo: ModuloItem; titulo: string; valor: string; nivel?: 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'cinza'; rota?: string }
export interface AnoGeral { ano: number; itens: ItemGeral[] }

export function agruparPorAno(itens: ItemGeral[]): AnoGeral[] {
  const ordenados = [...itens].sort((a, b) => b.data.localeCompare(a.data));
  const anos = new Map<number, ItemGeral[]>();
  for (const i of ordenados) { const a = Number(i.data.slice(0, 4)); anos.set(a, [...(anos.get(a) ?? []), i]); }
  return [...anos.entries()].sort(([a], [b]) => b - a).map(([ano, its]) => ({ ano, itens: its }));
}

/** Fase 4: itens do Saúde & Bem-estar — medidas individuais, sono e atividade agregados por semana, check-ins. Puro. */
export function itensBemEstar(e: {
  corporais: { medidoEm: string; tipo: string; valores: { kg?: number; cm?: number; gordura_pct?: number } }[];
  sonos: { acordouEm: string; minutos: number }[];
  atividades: { inicio: string; duracaoMin: number; intensidade: string }[];
  checkins: { semana: string; bemEstar: number | null; energia: number | null; estresse: number | null }[];
  semanaDe: (iso: string) => { inicio: string; fim: string };
  formatarHm: (min: number) => string;
}): ItemGeral[] {
  const fmt = (n: number) => String(n).replace('.', ',');
  const out: ItemGeral[] = [];
  for (const m of e.corporais) {
    if (m.tipo === 'peso' && m.valores.kg != null) out.push({ data: m.medidoEm.slice(0, 10), modulo: 'bem_estar', titulo: 'Peso', valor: `${fmt(m.valores.kg)} kg`, rota: '/(app)/bem-estar/corpo' });
    else if (m.tipo === 'cintura' && m.valores.cm != null) out.push({ data: m.medidoEm.slice(0, 10), modulo: 'bem_estar', titulo: 'Circunferência abdominal', valor: `${fmt(m.valores.cm)} cm`, rota: '/(app)/bem-estar/corpo' });
    else if (m.tipo === 'composicao') out.push({ data: m.medidoEm.slice(0, 10), modulo: 'bem_estar', titulo: 'Composição corporal', valor: m.valores.gordura_pct != null ? `gordura ${fmt(m.valores.gordura_pct)} %` : '', rota: '/(app)/bem-estar/corpo/composicao' });
  }
  const porSemana = <T,>(lista: T[], dataDe: (x: T) => string) => { const g = new Map<string, T[]>(); for (const x of lista) { const k = e.semanaDe(dataDe(x).slice(0, 10)).inicio; g.set(k, [...(g.get(k) ?? []), x]); } return g; };
  for (const [semana, ss] of porSemana(e.sonos, (s) => s.acordouEm)) out.push({ data: semana, modulo: 'bem_estar', titulo: `Sono — semana de ${semana.slice(8, 10)}/${semana.slice(5, 7)}`, valor: `média ${e.formatarHm(Math.round(ss.reduce((a, s) => a + s.minutos, 0) / ss.length))} (${ss.length} ${ss.length === 1 ? 'noite' : 'noites'})`, rota: '/(app)/bem-estar/sono' });
  for (const [semana, as] of porSemana(e.atividades, (a) => a.inicio)) { const contam = as.reduce((s, a) => s + (a.intensidade === 'moderada' ? a.duracaoMin : a.intensidade === 'vigorosa' ? a.duracaoMin * 2 : 0), 0); out.push({ data: semana, modulo: 'bem_estar', titulo: `Atividade — semana de ${semana.slice(8, 10)}/${semana.slice(5, 7)}`, valor: `${contam} min que contam · ${as.length} ${as.length === 1 ? 'sessão' : 'sessões'}`, rota: '/(app)/bem-estar/atividade' }); }
  for (const c of e.checkins) out.push({ data: c.semana, modulo: 'bem_estar', titulo: 'Check-in semanal', valor: [c.bemEstar != null ? `bem-estar ${c.bemEstar}/10` : null, c.energia != null ? `energia ${c.energia}/10` : null, c.estresse != null ? `estresse ${c.estresse}/10` : null].filter(Boolean).join(' · '), rota: '/(app)/bem-estar/checkin' });
  return out;
}
