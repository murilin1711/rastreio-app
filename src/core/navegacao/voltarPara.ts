/**
 * Cada aba guarda a própria pilha de telas. Abrir uma tela de Minha Saúde a partir da Home a empilhava
 * em cima do que tinha ficado lá (ex.: um relatório aberto dias antes pelo Rastreamentos), e a seta de
 * voltar levava para essa tela esquecida. Com `voltarPara`, a seta leva de onde a pessoa veio (D-054).
 */
export type Aba = 'inicio' | 'agenda' | 'historico' | 'minha-saude';
type HrefObjeto = { pathname: string; params?: Record<string, unknown> };

const ABAS: Aba[] = ['agenda', 'historico', 'minha-saude'];

/** Aba a que o caminho pertence, ou `null` quando é um módulo (abre por cima das abas). */
export function abaDe(caminho: string): Aba | null {
  const semGrupos = caminho.split('?')[0].replace(/\/\([^)]+\)/g, '');
  const primeiro = semGrupos.split('/').filter(Boolean)[0];
  if (!primeiro) return 'inicio';
  return (ABAS as string[]).includes(primeiro) ? (primeiro as Aba) : null;
}

/** Acrescenta `voltarPara` quando o destino é uma aba diferente da de origem; senão devolve o href como veio. */
export function comVolta(href: string | HrefObjeto, origem: string): string | HrefObjeto {
  const pathname = typeof href === 'string' ? href.split('?')[0] : href.pathname;
  const destino = abaDe(pathname);
  if (!destino || destino === abaDe(origem)) return href;
  const params: Record<string, unknown> = typeof href === 'string'
    ? Object.fromEntries(new URLSearchParams(href.split('?')[1] ?? ''))
    : { ...href.params };
  return { pathname, params: { ...params, voltarPara: origem } };
}
