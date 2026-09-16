import type { ExameEntrada, PerfilRegras, RegraParametros } from '../tipos';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function temAntecedente(perfil: PerfilRegras, condicao: string, grau?: 'primeiro' | 'segundo', idadeMax?: number): boolean {
  return perfil.antecedentes.some(
    (a) =>
      a.condicao === condicao &&
      (grau ? a.grau === grau : true) &&
      (idadeMax == null ? true : a.idadeDiagnostico != null && a.idadeDiagnostico < idadeMax),
  );
}

export function contarAntecedentes(perfil: PerfilRegras, condicao: string, grau: 'primeiro' | 'segundo'): number {
  return perfil.antecedentes.filter((a) => a.condicao === condicao && a.grau === grau).length;
}

export function idadeMaisJovem(perfil: PerfilRegras, condicao: string, grau?: 'primeiro' | 'segundo'): number | null {
  const idades = perfil.antecedentes
    .filter((a) => a.condicao === condicao && (grau ? a.grau === grau : true) && a.idadeDiagnostico != null)
    .map((a) => a.idadeDiagnostico as number);
  return idades.length ? Math.min(...idades) : null;
}

export function temGenetica(perfil: PerfilRegras, ...termos: string[]): boolean {
  const lista = perfil.doencasGeneticas.map(norm);
  return termos.some((t) => lista.some((g) => g.includes(norm(t))));
}

export function temHistoricoPessoal(perfil: PerfilRegras, ...termos: string[]): boolean {
  const lista = [...perfil.historicoCancerPessoal, ...perfil.lesoesPrecursoras].map(norm);
  return termos.some((t) => lista.some((h) => h.includes(norm(t))));
}

/** Casamento genérico com campos extras injetados pelo handler (ex.: imunossuprimida). */
export function casaCondicao(regra: RegraParametros, exame: ExameEntrada, extras: Record<string, unknown> = {}): boolean {
  const alvo: Record<string, unknown> = { ...exame.resultado, ...extras };
  const chaves = Object.keys(regra.condicao).filter((k) => !k.startsWith('idade_'));
  return chaves.length > 0 && chaves.every((k) => regra.condicao[k] === alvo[k]);
}
