/** Linha do tempo geral (§60): itens de todos os módulos, agrupados por ano, mais recentes primeiro. Puro. */
export type ModuloItem = 'cardio' | 'rastreando' | 'medicacao' | 'consulta' | 'documento';
export interface ItemGeral { data: string; modulo: ModuloItem; titulo: string; valor: string; nivel?: 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'cinza'; rota?: string }
export interface AnoGeral { ano: number; itens: ItemGeral[] }

export function agruparPorAno(itens: ItemGeral[]): AnoGeral[] {
  const ordenados = [...itens].sort((a, b) => b.data.localeCompare(a.data));
  const anos = new Map<number, ItemGeral[]>();
  for (const i of ordenados) { const a = Number(i.data.slice(0, 4)); anos.set(a, [...(anos.get(a) ?? []), i]); }
  return [...anos.entries()].sort(([a], [b]) => b - a).map(([ano, its]) => ({ ano, itens: its }));
}
