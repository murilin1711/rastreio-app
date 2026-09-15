function paraDataUTC(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

function anosCompletos(inicio: Date, fim: Date): number {
  let anos = fim.getUTCFullYear() - inicio.getUTCFullYear();
  const aindaNaoFezAniversario =
    fim.getUTCMonth() < inicio.getUTCMonth() ||
    (fim.getUTCMonth() === inicio.getUTCMonth() && fim.getUTCDate() < inicio.getUTCDate());
  if (aindaNaoFezAniversario) anos -= 1;
  return anos;
}

export function calcularIdade(dataNascimento: string, hoje: Date = new Date()): number {
  return anosCompletos(paraDataUTC(dataNascimento), hoje);
}

/** Maços-ano = (cigarros/dia ÷ 20) × anos fumando (§35). Uma casa decimal. */
export function calcularMacosAno(cigarrosDia: number | null, anosFumando: number | null): number | null {
  if (cigarrosDia == null || anosFumando == null) return null;
  return Math.round((cigarrosDia / 20) * anosFumando * 10) / 10;
}

/** IMC = kg / m². Uma casa decimal. */
export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}

export function anosDesde(data: string | null, hoje: Date = new Date()): number | null {
  if (!data) return null;
  return anosCompletos(paraDataUTC(data), hoje);
}
