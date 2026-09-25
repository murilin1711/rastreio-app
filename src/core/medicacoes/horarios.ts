/** '8' | '08' | '8:00' | '08h' | '20h30' | '20:30' → 'HH:MM'; inválido → null. */
export function normalizarHorario(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})(?:[:hH](\d{2})?)?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Separa por vírgula, espaço ou barra; devolve os válidos ordenados e os trechos inválidos. */
export function parsearHorarios(texto: string): { horarios: string[]; invalidos: string[] } {
  const partes = texto.split(/[,\s/]+/).filter(Boolean);
  const horarios: string[] = [];
  const invalidos: string[] = [];
  for (const p of partes) {
    const h = normalizarHorario(p);
    if (h) horarios.push(h);
    else invalidos.push(p);
  }
  return { horarios: [...new Set(horarios)].sort(), invalidos };
}

/** ['08:00','20:30'] → '08h / 20h30' */
export function formatarHorarios(horarios: string[]): string {
  return horarios
    .map((h) => {
      const [hh, mm] = h.split(':');
      return mm === '00' ? `${hh}h` : `${hh}h${mm}`;
    })
    .join(' / ');
}

/** Quantas vezes por dia (D-045). 2 = de 12 em 12 h, 3 = de 8 em 8 h, 4 = de 6 em 6 h. */
export type Ritmo = 1 | 2 | 3 | 4;
export const RITMOS: Ritmo[] = [1, 2, 3, 4];

const paraMin = (h: string) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
const deMin = (m: number) => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };

/** Reparte o dia a partir da primeira dose; ordena pelo relógio (a dose das 20h de ontem vem antes da das 8h). */
export function horariosDoRitmo(primeira: string, vezes: Ritmo): string[] {
  const passo = 1440 / vezes;
  const base = paraMin(primeira);
  return Array.from({ length: vezes }, (_, i) => deMin(base + i * passo)).sort();
}

/**
 * O caminho de volta, ao abrir um remédio já cadastrado: se os horários são igualmente espaçados, é
 * aquele ritmo; se a pessoa ajustou algum à mão, é "outro" — e o app não mexe mais neles sozinho.
 */
export function ritmoDe(horarios: string[]): Ritmo | 'outro' {
  const n = horarios.length;
  if (n < 1 || n > 4) return 'outro';
  const ordenados = [...horarios].sort();
  return horariosDoRitmo(ordenados[0], n as Ritmo).join() === ordenados.join() ? (n as Ritmo) : 'outro';
}
