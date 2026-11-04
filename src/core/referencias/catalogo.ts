/**
 * Fontes científicas citadas dentro do app (diretriz 1.4.1 da App Store: toda informação de saúde
 * mostra de onde veio, com link). Espelha `docs/nero/referencias/REFERENCIAS.md`: ao trocar uma
 * versão lá, troque aqui também.
 *
 * Cada tela com conteúdo clínico mostra as fontes do seu `TemaFonte` (componente `FontesDaTela`),
 * e a tela "Fontes científicas" lista o acervo inteiro.
 */

export interface Referencia {
  /** Nome curto, como aparece na lista (ex.: "Diretriz Brasileira de Hipertensão Arterial"). */
  titulo: string;
  /** Quem publicou (sociedade, órgão ou revista). */
  emissor: string;
  ano: number;
  url: string;
}

export const REFERENCIAS = {
  // Coração & Metabolismo
  dbha2025: { titulo: 'Diretriz Brasileira de Hipertensão Arterial', emissor: 'SBC, SBH e SBN · Arq Bras Cardiol', ano: 2025, url: 'https://abccardiol.org/article/diretriz-brasileira-de-hipertensao-arterial-2025/' },
  medidasPa2023: { titulo: 'Diretrizes Brasileiras de Medidas da Pressão Arterial Dentro e Fora do Consultório (inclui MRPA)', emissor: 'SBC · Arq Bras Cardiol', ano: 2023, url: 'https://abccardiol.org/article/diretrizes-brasileiras-de-medidas-da-pressao-arterial-dentro-e-fora-do-consultorio-2023/' },
  dislipidemias2025: { titulo: 'Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose', emissor: 'SBC · Arq Bras Cardiol', ano: 2025, url: 'https://abccardiol.org/article/diretriz-brasileira-de-dislipidemias-e-prevencao-da-aterosclerose-2025/' },
  prevent2024: { titulo: 'Development and Validation of the PREVENT Equations (Khan SS et al.)', emissor: 'American Heart Association · Circulation', ano: 2024, url: 'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.123.067626' },
  prevent2023: { titulo: 'Novel Prediction Equations for Absolute Risk Assessment of Total Cardiovascular Disease (Khan SS et al.)', emissor: 'American Heart Association · Circulation', ano: 2023, url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001191' },
  sbdMetas2026: { titulo: 'Metas de controle glicêmico', emissor: 'Diretriz da Sociedade Brasileira de Diabetes', ano: 2026, url: 'https://diretriz.diabetes.org.br/metas-de-controle-glicemico/' },
  sbdMonitorizacao2026: { titulo: 'Monitorização da glicemia capilar, da glicose intersticial e da cetonemia', emissor: 'Diretriz da Sociedade Brasileira de Diabetes', ano: 2026, url: 'https://diretriz.diabetes.org.br/monitorizacao-da-glicemia-capilar-da-glicose-intersticial-cgme-cetonemia-capilar-em-pessoas-com-diabetes-mellitus/' },
  sbdDiagnostico2026: { titulo: 'Diagnóstico de diabetes mellitus', emissor: 'Diretriz da Sociedade Brasileira de Diabetes', ano: 2026, url: 'https://diretriz.diabetes.org.br/diagnostico-de-diabetes-mellitus/' },
  sbdDiasDoenca2026: { titulo: 'Manejo dos dias de doença no diabetes tipo 1', emissor: 'Diretriz da Sociedade Brasileira de Diabetes', ano: 2026, url: 'https://diretriz.diabetes.org.br/manejo-dos-dias-de-doenca-no-dm1/' },
  sbdCetoacidose2026: { titulo: 'Diagnóstico e tratamento da cetoacidose diabética', emissor: 'Diretriz da Sociedade Brasileira de Diabetes', ano: 2026, url: 'https://diretriz.diabetes.org.br/diagnostico-e-tratamento-da-cetoacidose-diabetica/' },

  // Rastreamento de câncer
  mamaCbr2023: { titulo: 'Recomendações do CBR, SBM e FEBRASGO para o rastreamento do câncer de mama no Brasil', emissor: 'CBR, SBM e FEBRASGO · Radiol Bras', ano: 2023, url: 'https://cbr.org.br/wp-content/uploads/2023/09/Recomendacoes-do-Colegio.pdf' },
  mamaCnm2025: { titulo: 'Nota técnica da Comissão Nacional de Mamografia sobre o rastreamento do câncer de mama', emissor: 'CBR, SBM e FEBRASGO', ano: 2025, url: 'https://cbr.org.br/wp-content/uploads/2025/01/Nota-tecnica-da-Comissao-Nacional-de-Mamografia-sobre-o-rastreamento-do-Cancer-de-Mama-no-Brasil.pdf' },
  mamaMs2025: { titulo: 'Ministério da Saúde recomenda mamografia a partir dos 40 anos', emissor: 'Ministério da Saúde (via FEBRASGO)', ano: 2025, url: 'https://www.febrasgo.org.br/pt/noticias/item/2211-ministerio-da-saude-recomenda-mamografia-a-partir-dos-40-anos' },
  coloInca2025: { titulo: 'Diretrizes Brasileiras para o Rastreamento do Câncer do Colo do Útero (teste DNA-HPV), 3ª ed.', emissor: 'INCA / Ministério da Saúde', ano: 2025, url: 'https://ninho.inca.gov.br/jspui/handle/123456789/17858' },
  coloIncaPagina: { titulo: 'Detecção precoce do câncer do colo do útero', emissor: 'INCA', ano: 2025, url: 'https://www.gov.br/inca/pt-br/assuntos/gestor-e-profissional-de-saude/controle-do-cancer-do-colo-do-utero/acoes/deteccao-precoce' },
  colorretalConitec2026: { titulo: 'Diretrizes Brasileiras do Rastreamento do Câncer de Cólon e Reto', emissor: 'CONITEC / Ministério da Saúde', ano: 2026, url: 'https://www.gov.br/conitec/pt-br/midias/consultas/relatorios/2026/relatorio-preliminar-diretrizes-brasileiras-do-rastreamento-do-cancer-de-colon-e-reto-cp-20' },
  colorretalAcg2021: { titulo: 'ACG Clinical Guidelines: Colorectal Cancer Screening (Shaukat A et al.)', emissor: 'American College of Gastroenterology · Am J Gastroenterol', ano: 2021, url: 'https://doi.org/10.14309/ajg.0000000000001122' },
  pulmaoUspstf2021: { titulo: 'Lung Cancer: Screening — Recommendation Statement', emissor: 'US Preventive Services Task Force', ano: 2021, url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening' },
  pulmaoLungRads2022: { titulo: 'Lung-RADS v2022', emissor: 'American College of Radiology', ano: 2022, url: 'https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/Lung-RADS' },
  prostataSbu2023: { titulo: 'Posicionamento da SBU, SBOC e SBRT sobre o rastreamento do câncer de próstata', emissor: 'SBU, SBOC e SBRT', ano: 2023, url: 'https://sbradioterapia.com.br/wp-content/uploads/2023/11/rastreamento_2023_sociedades.pdf' },
  prostataInca2023: { titulo: 'Ministério da Saúde recomenda o não rastreamento populacional do câncer de próstata', emissor: 'INCA / Ministério da Saúde', ano: 2023, url: 'https://www.gov.br/inca/pt-br/assuntos/noticias/2023/ministerio-da-saude-recomenda-o-nao-rastreamento-populacional-do-cancer-de-proposta' },

  // Saúde & Bem-estar
  abeso2016: { titulo: 'Diretrizes Brasileiras de Obesidade, 4ª ed.', emissor: 'ABESO', ano: 2016, url: 'https://abeso.org.br/wp-content/uploads/2019/12/Diretrizes-Download-Diretrizes-Brasileiras-de-Obesidade-2016.pdf' },
  abeso2026: { titulo: 'Diretriz Brasileira de Tratamento Farmacológico da Obesidade', emissor: 'ABESO', ano: 2026, url: 'https://abeso.org.br/wp-content/uploads/2026/03/Diretrizes-ABESO_completo_20260320.pdf' },
  obesidadeControlada2023: { titulo: 'Obesidade Controlada (e-book)', emissor: 'ABESO e SBEM', ano: 2023, url: 'https://abeso.org.br/wp-content/uploads/2023/12/Ebook_Obesidade_Controlada.pdf' },
  obesidadeDcv2025: { titulo: 'Diretriz Brasileira para o Manejo da Obesidade e Prevenção de Doença Cardiovascular', emissor: 'ABESO, SBD, SBEM, SBC e ABS · Arq Bras Cardiol', ano: 2025, url: 'https://doi.org/10.36660/abc.20250621' },
  omsCintura2011: { titulo: 'Waist circumference and waist–hip ratio: report of a WHO expert consultation', emissor: 'Organização Mundial da Saúde', ano: 2011, url: 'https://iris.who.int/handle/10665/44583' },
  omsAtividade2020: { titulo: 'WHO guidelines on physical activity and sedentary behaviour', emissor: 'Organização Mundial da Saúde', ano: 2020, url: 'https://www.who.int/publications/i/item/9789240015128' },
  msAtividade2021: { titulo: 'Guia de Atividade Física para a População Brasileira', emissor: 'Ministério da Saúde', ano: 2021, url: 'https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/guias-e-manuais/2021/guia-de-atividade-fisica-para-a-populacao-brasileira.pdf/view' },
  sonoAasm2015: { titulo: 'Recommended amount of sleep for a healthy adult (Watson NF et al.)', emissor: 'AASM e SRS · J Clin Sleep Med', ano: 2015, url: 'https://doi.org/10.5664/jcsm.4758' },
  aguaEfsa2010: { titulo: 'Scientific Opinion on Dietary Reference Values for water', emissor: 'EFSA Journal', ano: 2010, url: 'https://doi.org/10.2903/j.efsa.2010.1459' },
  aguaIom2005: { titulo: 'Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate', emissor: 'Institute of Medicine (National Academies)', ano: 2005, url: 'https://nap.nationalacademies.org/read/10925' },
  aguaEspen2022: { titulo: 'Practical guideline: Clinical nutrition and hydration in geriatrics', emissor: 'ESPEN', ano: 2022, url: 'https://www.espen.org/files/ESPEN-Guidelines/ESPEN_practical_guideline_Clinical_nutrition_and_hydration_in_geriatrics.pdf' },
} as const satisfies Record<string, Referencia>;

export type IdReferencia = keyof typeof REFERENCIAS;

/** Assunto de uma tela. Cada um lista as fontes de onde vêm os números e os textos daquela tela. */
export const FONTES_POR_TEMA = {
  pressao: ['dbha2025', 'medidasPa2023'],
  mrpa: ['medidasPa2023', 'dbha2025'],
  glicemia: ['sbdMetas2026', 'sbdMonitorizacao2026', 'sbdDiagnostico2026', 'sbdDiasDoenca2026', 'sbdCetoacidose2026'],
  risco: ['dislipidemias2025', 'prevent2024', 'prevent2023'],
  examesCardio: ['dislipidemias2025', 'sbdDiagnostico2026', 'sbdMetas2026'],
  checkup: ['dbha2025', 'dislipidemias2025', 'sbdDiagnostico2026', 'abeso2016', 'omsAtividade2020'],
  sinaisCardio: ['dbha2025', 'sbdCetoacidose2026', 'sbdDiasDoenca2026'],
  coracao: ['dbha2025', 'medidasPa2023', 'dislipidemias2025', 'prevent2024', 'sbdMetas2026'],
  mama: ['mamaCbr2023', 'mamaCnm2025', 'mamaMs2025'],
  colo_utero: ['coloInca2025', 'coloIncaPagina'],
  colorretal: ['colorretalConitec2026', 'colorretalAcg2021'],
  pulmao: ['pulmaoUspstf2021', 'pulmaoLungRads2022'],
  prostata: ['prostataSbu2023', 'prostataInca2023'],
  corpo: ['abeso2016', 'abeso2026', 'omsCintura2011', 'obesidadeControlada2023', 'obesidadeDcv2025'],
  atividade: ['omsAtividade2020', 'msAtividade2021'],
  sono: ['sonoAasm2015'],
  agua: ['aguaEfsa2010', 'aguaIom2005', 'aguaEspen2022'],
} as const satisfies Record<string, readonly IdReferencia[]>;

export type TemaFonte = keyof typeof FONTES_POR_TEMA;

/** Grupos da tela "Fontes científicas", na ordem dos módulos do app. */
export const GRUPOS_FONTES: { titulo: string; ids: readonly IdReferencia[] }[] = [
  { titulo: 'Coração & Metabolismo', ids: ['dbha2025', 'medidasPa2023', 'dislipidemias2025', 'prevent2024', 'prevent2023', 'sbdMetas2026', 'sbdMonitorizacao2026', 'sbdDiagnostico2026', 'sbdDiasDoenca2026', 'sbdCetoacidose2026'] },
  { titulo: 'Rastreamento de câncer', ids: ['mamaCbr2023', 'mamaCnm2025', 'mamaMs2025', 'coloInca2025', 'coloIncaPagina', 'colorretalConitec2026', 'colorretalAcg2021', 'pulmaoUspstf2021', 'pulmaoLungRads2022', 'prostataSbu2023', 'prostataInca2023'] },
  { titulo: 'Saúde & Bem-estar', ids: ['abeso2016', 'abeso2026', 'obesidadeControlada2023', 'obesidadeDcv2025', 'omsCintura2011', 'omsAtividade2020', 'msAtividade2021', 'sonoAasm2015', 'aguaEfsa2010', 'aguaIom2005', 'aguaEspen2022'] },
];

export function fontesDoTema(tema: TemaFonte): (Referencia & { id: IdReferencia })[] {
  return FONTES_POR_TEMA[tema].map((id) => ({ id, ...REFERENCIAS[id] }));
}
