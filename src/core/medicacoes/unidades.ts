import type { UnidadeDose } from './tipos';

export const UNIDADES: Record<
  UnidadeDose,
  { rotulo: string; singular: string; plural: string; passo: number; pergunta: string }
> = {
  comprimido: { rotulo: 'Comprimido', singular: 'comprimido', plural: 'comprimidos', passo: 0.5, pergunta: 'Quantos comprimidos?' },
  gota: { rotulo: 'Gota', singular: 'gota', plural: 'gotas', passo: 1, pergunta: 'Quantas gotas?' },
  unidade: { rotulo: 'Unidade (insulina)', singular: 'unidade', plural: 'unidades', passo: 1, pergunta: 'Quantas unidades?' },
  ml: { rotulo: 'mL', singular: 'mL', plural: 'mL', passo: 0.5, pergunta: 'Quantos mL?' },
  jato: { rotulo: 'Jato ou inalação', singular: 'jato', plural: 'jatos', passo: 1, pergunta: 'Quantos jatos?' },
};

/** 1.5 → '1,5'; 2 → '2' (até duas casas, sem zeros à direita). */
export function numeroBr(q: number): string {
  return String(Number(q.toFixed(2))).replace('.', ',');
}

/** 1 → '1 comprimido'; 0,5 → 'meio comprimido'; 1,5 → '1 comprimido e meio'; 2,5 mL → '2,5 mL'. */
export function formatarQuantidade(q: number, u: UnidadeDose): string {
  const { singular, plural } = UNIDADES[u];
  if (u === 'comprimido') {
    const inteiro = Math.floor(q);
    if (q - inteiro === 0.5) {
      if (inteiro === 0) return `meio ${singular}`;
      return `${inteiro} ${inteiro === 1 ? singular : plural} e meio`;
    }
  }
  return `${numeroBr(q)} ${q === 1 ? singular : plural}`;
}

/**
 * Quantidade levada ao passo da unidade (ao trocar a unidade no cadastro): arredonda para o múltiplo
 * mais próximo do passo e nunca fica abaixo dele. 1,5 comprimido → gota vira 2; 0,5 → 1.
 */
export function ajustarAoPasso(q: number, u: UnidadeDose): number {
  const { passo } = UNIDADES[u];
  return Math.max(passo, Math.round(Math.round(q / passo) * passo * 100) / 100);
}
