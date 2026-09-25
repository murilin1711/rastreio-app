import type { ProgramaHandler } from '../tipos';
import { casaCondicao, contarAntecedentes, idadeMaisJovem, temAntecedente, temGenetica, temHistoricoPessoal } from './util';

const CONITEC = 'CONITEC 2026: Diretrizes Brasileiras do Rastreamento do Câncer de Cólon e Reto (aprovada em 23/06/2026)';
const ACG = 'ACG 2021 (Shaukat et al.)';

/** Rastreamento colorretal — decisões C-004 e C-005. */
export const colorretal: ProgramaHandler = {
  aplicavel: () => true,

  // CONITEC Rec. 5 (início aos 50) e Rec. 6 (final aos 75) → último FIT aos 74.
  faixaEtaria: () => ({ min: 50, max: 74 }),

  mensagemNaoElegivel: () => 'O rastreamento colorretal de risco padrão começa aos 50 anos, com FIT a cada 2 anos. Mantenha seu perfil atualizado.',

  fatoresModificadores(p) {
    // CONITEC: fora do "risco padrão"
    if (temGenetica(p, 'Lynch', 'polipose', 'PAF', 'FAP', 'MUTYH')) {
      return `Síndrome genética associada ao câncer colorretal: o rastreamento é individualizado e começa mais cedo. Procure acompanhamento com gastroenterologista ou coloproctologista e avaliação genética. (${CONITEC})`;
    }
    if (p.condicoes.dii) {
      return `Doença inflamatória intestinal (Crohn ou retocolite) muda o protocolo: a vigilância é feita por colonoscopia em intervalos definidos pelo seu gastroenterologista, não pelo FIT. (${CONITEC})`;
    }
    if (temHistoricoPessoal(p, 'colorretal', 'cólon', 'colon', 'reto', 'adenoma', 'pólipo', 'polipo')) {
      return `Você já teve câncer colorretal ou pólipo adenomatoso. O seguimento é individualizado por colonoscopia, conforme seu médico. (${CONITEC})`;
    }
    // ACG 2021, Rec. 9–12: história familiar não sindrômica
    const primeiroGrau = contarAntecedentes(p, 'colorretal', 'primeiro');
    const jovem = idadeMaisJovem(p, 'colorretal', 'primeiro');
    const casoPrecoce = temAntecedente(p, 'colorretal', 'primeiro', 60);
    if (primeiroGrau >= 2 || casoPrecoce) {
      const inicio = jovem != null ? Math.min(40, jovem - 10) : 40;
      const motivo = primeiroGrau >= 2 ? 'dois ou mais parentes de primeiro grau' : 'parente de primeiro grau diagnosticado antes dos 60 anos';
      const genetica = primeiroGrau >= 2 ? ' Considere avaliação genética.' : '';
      return `História familiar de câncer colorretal (${motivo}): a recomendação é começar com colonoscopia aos ${inicio} anos (40 anos ou 10 anos antes do parente mais jovem, o que vier primeiro) e repetir a cada 5 anos.${genetica} Converse com gastroenterologista ou coloproctologista. (${ACG}, Rec. 9${primeiroGrau >= 2 ? '–10' : ''})`;
    }
    if (primeiroGrau === 1) {
      const inicio = jovem != null ? Math.min(40, jovem - 10) : 40;
      return `Um parente de primeiro grau com câncer colorretal diagnosticado aos 60 anos ou mais: a recomendação é começar o rastreamento aos ${inicio} anos e, depois, seguir o calendário de risco habitual. Converse com seu médico. (${ACG}, Rec. 11)`;
    }
    return null; // parente de 2º grau → risco médio (ACG Rec. 12)
  },

  selecionarRegra(exame, regras) {
    if (exame.tipo === 'colonoscopia') {
      const r = exame.resultado;
      // Qualidade não confirmada → sem conduta automática (pendente: o médico define a repetição).
      if (r.achado === 'normal' && r.qualidade_adequada !== true) return null;
      const polipos = r.polipos as { histopatologico?: string } | undefined;
      const plano: Record<string, unknown> = { achado: r.achado, qualidade_adequada: r.qualidade_adequada, histopatologico: polipos?.histopatologico };
      const regra = regras.find((x) => casaCondicao(x, { ...exame, resultado: plano })) ?? null;
      if (!regra) return null;
      const doLaudo = r.intervalo_laudo_meses;
      if (regra.classificacao === 'controle' && typeof doLaudo === 'number' && doLaudo > 0) return { ...regra, intervaloMeses: doLaudo };
      return regra;
    }
    return regras.find((x) => casaCondicao(x, exame)) ?? null;
  },
};
