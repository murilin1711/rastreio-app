/** 'AAAA-MM-DD' do dia local de um instante (getters locais, não UTC). */
export function dataLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Desloca um dia 'AAAA-MM-DD' em `n` dias (negativo volta), no calendário local. */
export function somarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  return dataLocal(new Date(a, m - 1, d + n));
}

/** Dia local de um registro: instante ISO vira o dia local; 'AAAA-MM-DD' passa como veio. */
export function diaDe(iso: string): string {
  return iso.length > 10 ? dataLocal(new Date(iso)) : iso;
}
