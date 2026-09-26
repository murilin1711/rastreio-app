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

/**
 * Um defeito que dispara em sequência (tela que recarrega sozinha) gastaria as 5.000 ocorrências/mês do
 * plano gratuito num dia. Cada erro diferente vai até `maximo` vezes por abertura do app; o resto fica.
 */
export function limitarRepeticao(maximo: number) {
  const contagem = new Map<string, number>();
  return <T extends { exception?: { values?: { type?: string; value?: string }[] }; message?: unknown }>(e: T): T | null => {
    const x = e.exception?.values?.[0];
    const chave = x ? `${x.type}:${x.value}` : String(e.message ?? '');
    const n = (contagem.get(chave) ?? 0) + 1;
    contagem.set(chave, n);
    return n > maximo ? null : e;
  };
}
