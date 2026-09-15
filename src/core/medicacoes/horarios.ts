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
