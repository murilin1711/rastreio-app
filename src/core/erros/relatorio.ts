import * as Sentry from '@sentry/react-native';
import type React from 'react';
import { limitarRepeticao, limparEvento, limparRastro } from './limpeza';

/**
 * Relatório de erros (D-058). Só liga com a chave do projeto no Sentry (`EXPO_PUBLIC_SENTRY_DSN`) e
 * fora do modo de desenvolvimento, onde o erro já aparece no Metro. Sem captura de tela nem estrutura
 * da tela, sem dados de pessoa, e a limpeza tira o que pode ter dado de saúde.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function iniciarRelatorioDeErros(): void {
  if (!DSN || __DEV__) return;
  const deixa = limitarRepeticao(5);
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    tracesSampleRate: 0,
    beforeBreadcrumb: (b) => limparRastro(b),
    beforeSend: (e) => { const limpo = deixa(e); return limpo ? limparEvento(limpo) : null; },
  });
}

/**
 * Envolve a raiz: erro de renderização que derrubaria o app também é registrado. Só quando o Sentry
 * foi iniciado; sem isso ele avisa no Metro que `wrap` veio antes de `init`.
 */
export function envolverRaiz(Raiz: () => React.JSX.Element | null): React.ComponentType {
  return DSN && !__DEV__ ? Sentry.wrap(Raiz as React.ComponentType<Record<string, unknown>>) : Raiz;
}
