import type { PerfilRegras, ProgramaHandler } from '../tipos';
import { casaCondicao } from './util';

const FONTE = 'USPSTF 2021 (Grau B), endossada pela SBPT';

/** Critérios USPSTF 2021: 50–80 anos, ≥ 20 maços-ano, fumante atual ou cessação há ≤ 15 anos. */
export function elegivelTcbd(p: PerfilRegras): boolean {
  const t = p.tabagismo;
  if (t.status === 'nunca' || t.macosAno == null || t.macosAno < 20) return false;
  if (t.status === 'ex' && (t.anosDesdeCessacao == null || t.anosDesdeCessacao > 15)) return false;
  return true;
}

/** Rastreamento do câncer de pulmão — decisões C-006 e C-007. */
export const pulmao: ProgramaHandler = {
  aplicavel: () => true,

  faixaEtaria: (p) => (elegivelTcbd(p) ? { min: 50, max: 80 } : null),

  mensagemNaoElegivel(p) {
    const t = p.tabagismo;
    if (t.status !== 'nunca' && t.macosAno == null) {
      return 'Para avaliar o rastreamento de câncer de pulmão, informe no seu perfil quantos cigarros por dia e por quantos anos você fumou.';
    }
    if (t.status === 'ex' && t.anosDesdeCessacao == null) {
      return 'Para avaliar o rastreamento de câncer de pulmão, informe no seu perfil quando parou de fumar.';
    }
    if (t.status === 'ex' && (t.anosDesdeCessacao ?? 0) > 15) {
      return `Você parou de fumar há mais de 15 anos: a diretriz não recomenda tomografia de rastreamento nesse caso. (${FONTE})`;
    }
    return `A tomografia de baixa dose é recomendada entre 50 e 80 anos para quem fumou pelo menos 20 maços-ano e ainda fuma ou parou há até 15 anos. Você não atende a esses critérios no momento. (${FONTE})`;
  },

  fatoresModificadores: () => null,

  // Só a categoria Lung-RADS decide; o modificador S não altera o manejo do rastreamento (ACR v2022, nota 15).
  selecionarRegra: (exame, regras) => regras.find((r) => casaCondicao(r, { ...exame, resultado: { lungrads: exame.resultado.lungrads } })) ?? null,
};
