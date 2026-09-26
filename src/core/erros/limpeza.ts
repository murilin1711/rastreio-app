/**
 * Limpeza do relatório de erros (D-058). Fica o que serve para consertar (mensagem, pilha, aparelho,
 * versão) e sai o que pode ter dado de saúde ou identificar a pessoa: textos da tela, console,
 * parâmetros de endereço, usuário, requisição e extras. Tipos mínimos para não depender do Sentry aqui.
 */
type Dados = Record<string, unknown>;
export interface Rastro { category?: string; message?: string; data?: Dados }
export interface Evento { user?: unknown; request?: unknown; extra?: unknown }

const DESCARTAR = /^(touch|ui\.|console)/;
const semParametros = (v: unknown) => (typeof v === 'string' ? v.split('?')[0] : v);

export function limparRastro<T extends Rastro>(r: T): T | null {
  if (r.category && DESCARTAR.test(r.category)) return null;
  if (!r.data) return r;
  const data: Dados = {};
  for (const [k, v] of Object.entries(r.data)) {
    if (k === 'url' || k === 'from' || k === 'to') data[k] = semParametros(v);
    else if (k === 'method' || k === 'status_code' || k === 'reason') data[k] = v;
    // corpo de requisição/resposta e qualquer outro campo ficam de fora
  }
  return { ...r, data };
}

export function limparEvento<T extends Evento>(e: T): T {
  const { user: _u, request: _r, extra: _x, ...resto } = e;
  return resto as T;
}
