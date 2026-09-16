import type { ProgramaHandler } from '../tipos';
import { casaCondicao, contarAntecedentes, idadeMaisJovem, temAntecedente, temGenetica, temHistoricoPessoal } from './util';

const FONTE = 'CBR/SBM/FEBRASGO 2023 — Urban et al., Radiol Bras 56(4):207-14; reafirmada pela Nota Técnica da CNM de 27/01/2025';

/**
 * Rastreamento do câncer de mama — decisões C-001 e C-009.
 * Risco habitual: mamografia anual dos 40 aos 74; a partir dos 75, individualizado (→ "acompanhamento médico").
 */
export const mama: ProgramaHandler = {
  aplicavel: (p) => p.sexoNascimento === 'feminino',

  faixaEtaria: () => ({ min: 40, max: 74 }),

  mensagemNaoElegivel: () => 'A mamografia de rastreamento começa aos 40 anos para mulheres de risco habitual. Mantenha seu perfil atualizado para o NERO avisar quando chegar o momento.',

  fatoresModificadores(p) {
    if (temHistoricoPessoal(p, 'mama', 'CDIS', 'carcinoma ductal')) {
      return `Você já teve câncer de mama. Após o tratamento, a recomendação é mamografia anual — 6 meses após a radioterapia na cirurgia conservadora, ou 1 ano após o tratamento na mastectomia (mama contralateral). O seguimento é definido pela sua equipe. (${FONTE})`;
    }
    if (temGenetica(p, 'BRCA1')) {
      return `Mutação em BRCA1: mamografia anual a partir do diagnóstico da mutação, não antes dos 35 anos, e ressonância anual não antes dos 25. Seu protocolo é individualizado — converse com mastologista. (${FONTE})`;
    }
    if (temGenetica(p, 'TP53', 'Li-Fraumeni')) {
      return `Mutação em TP53: mamografia anual não antes dos 30 anos e ressonância anual não antes dos 20. Protocolo individualizado com mastologista. (${FONTE})`;
    }
    if (temGenetica(p, 'BRCA2', 'PALB2', 'CHEK2', 'ATM', 'CDH1', 'PTEN', 'STK11')) {
      return `Mutação em gene de risco moderado a alto para câncer de mama: mamografia e ressonância anuais a partir do diagnóstico, não antes dos 30 anos. Protocolo individualizado com mastologista. (${FONTE})`;
    }
    if (p.radioterapiaToracica) {
      return `Radioterapia no tórax antes dos 30 anos: mamografia anual a partir do 8º ano após o tratamento (não antes dos 30) e ressonância anual (não antes dos 25). Converse com mastologista. (${FONTE})`;
    }
    if (temHistoricoPessoal(p, 'hiperplasia', 'HLA', 'HDA', 'CLIS', 'carcinoma lobular in situ')) {
      return `Lesão como hiperplasia atípica ou carcinoma lobular in situ pede uma estimativa do seu risco por um modelo matemático, feita pelo médico: abaixo de 20%, mamografia anual a partir dos 40; a partir de 20%, mamografia e ressonância anuais desde o diagnóstico (não antes dos 30). (${FONTE})`;
    }
    const forte =
      temAntecedente(p, 'mama', 'primeiro') ||
      temAntecedente(p, 'ovario') ||
      contarAntecedentes(p, 'mama', 'primeiro') + contarAntecedentes(p, 'mama', 'segundo') >= 2;
    if (forte) {
      const jovem = idadeMaisJovem(p, 'mama', 'primeiro');
      const inicio = jovem != null ? Math.max(30, jovem - 10) : null;
      const quando = inicio != null
        ? ` Se o risco estimado for de 20% ou mais, a recomendação é mamografia e ressonância anuais a partir dos ${inicio} anos (10 anos antes do parente mais jovem, não antes dos 30 anos).`
        : ' Se o risco estimado for de 20% ou mais, mamografia e ressonância anuais começam 10 anos antes do diagnóstico do parente mais jovem (não antes dos 30 anos).';
      return `Sua história familiar pode indicar risco aumentado. Peça ao seu médico uma estimativa do seu risco ao longo da vida por um modelo matemático.${quando} (${FONTE})`;
    }
    return null;
  },

  selecionarRegra(exame, regras) {
    // Só o BI-RADS decide; densidade e intervalo do laudo são complementos.
    const regra = regras.find((r) => casaCondicao(r, { ...exame, resultado: { birads: exame.resultado.birads } })) ?? null;
    if (!regra) return null;
    // BI-RADS 3: o intervalo do laudo prevalece sobre o padrão de 6 meses (C-009).
    const doLaudo = exame.resultado.intervalo_laudo_meses;
    if (regra.classificacao === 'controle' && typeof doLaudo === 'number' && doLaudo > 0) {
      return { ...regra, intervaloMeses: doLaudo };
    }
    return regra;
  },
};
