import type { PerfilRegras, ProgramaHandler } from '../tipos';
import { casaCondicao, temAntecedente, temGenetica } from './util';

const FONTE = 'Posicionamento SBU/SBOC/SBRT sobre o rastreamento do câncer de próstata (nov/2023)';

/** Grupo de maior risco (Posicionamento 2023): histórico familiar, etnia negra ou mutação patogênica em BRCA → conversa a partir dos 40. */
export function maiorRisco(p: PerfilRegras): boolean {
  return p.racaCor === 'preta' || temAntecedente(p, 'prostata', 'primeiro') || temGenetica(p, 'BRCA');
}

function mesesEntre(deIso: string, ateIso: string): number {
  const [a1, m1] = deIso.split('-').map(Number);
  const [a2, m2] = ateIso.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

/** Decisão compartilhada sobre o rastreamento do câncer de próstata — decisão C-008 (opção A). */
export const prostata: ProgramaHandler = {
  aplicavel: (p) => p.sexoNascimento === 'masculino',

  // > 50 anos com expectativa de vida > 10 anos; 40–50 no grupo de maior risco; > 75 → "acompanhamento médico".
  faixaEtaria: (p) => ({ min: maiorRisco(p) ? 40 : 50, max: 75 }),

  mensagemNaoElegivel: (p) =>
    `As sociedades brasileiras recomendam conversar com um profissional sobre riscos e benefícios do rastreamento a partir dos ${maiorRisco(p) ? 40 : 50} anos. (${FONTE})`,

  fatoresModificadores: () => null,

  selecionarRegra(exame, regras) {
    if (exame.tipo !== 'psa') return regras.find((r) => casaCondicao(r, exame)) ?? null;
    const total = exame.resultado.psa_total;
    const ref = exame.resultado.referencia_max;
    // §49: sem a referência do laboratório não há como interpretar; nunca um ponto de corte único.
    if (typeof total !== 'number' || typeof ref !== 'number') return null;
    const regra = regras.find((r) => casaCondicao(r, { ...exame, resultado: { psa_fora_referencia: total > ref } })) ?? null;
    if (!regra) return null;
    // A SBU não fixa periodicidade: só há data automática se o médico definiu quando repetir.
    const repetir = exame.resultado.repetir_em;
    if (regra.classificacao === 'normal' && typeof repetir === 'string') {
      const meses = mesesEntre(exame.dataRealizacao, repetir);
      return { ...regra, intervaloMeses: meses > 0 ? meses : null };
    }
    return regra;
  },
};
