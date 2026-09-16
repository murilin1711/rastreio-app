import type { ConteudoPrograma } from './tipos';

export const prostata: ConteudoPrograma = {
  titulo: 'Câncer de próstata',
  subtitulo: 'Decisão compartilhada sobre o rastreamento',
  icone: 'male-outline',
  capa: ['#1D4ED8', '#60A5FA'],
  entenda: [
    'O câncer de próstata é o mais comum entre homens no Brasil, depois do câncer de pele. Muitos casos crescem devagar e nunca causariam problemas; outros são agressivos.',
    'Por isso, o rastreamento com PSA não é uma regra para todos: as sociedades brasileiras de urologia, oncologia e radioterapia recomendam que cada homem converse com um profissional sobre riscos e benefícios e decida junto.',
    'Essa conversa é recomendada a partir dos 50 anos para quem tem expectativa de vida superior a 10 anos, e a partir dos 40 para quem tem histórico familiar, é negro ou tem mutação em BRCA. Acima dos 75 anos, só com expectativa de vida acima de 10 anos.',
    'O PSA é interpretado no contexto: idade, tamanho da próstata, exame clínico e história. Um valor isolado não define diagnóstico.',
  ],
  noSus: 'O Ministério da Saúde e o INCA não recomendam o rastreamento populacional do câncer de próstata (nota técnica de 2023), pelo risco de diagnósticos e tratamentos desnecessários. Por isso a decisão é individual, com o médico.',
  fatoresEducativos: [
    'Idade acima de 50 anos',
    'Obesidade e síndrome metabólica',
    'Exposição ocupacional a agentes químicos',
  ],
  fatoresModificadores: [
    'Pai ou irmão com câncer de próstata',
    'Etnia negra',
    'Mutação em BRCA1 ou BRCA2',
  ],
  sinaisAlerta: [
    { id: 'dificuldade_urinar', texto: 'Dificuldade para urinar ou jato fraco' },
    { id: 'urinar_frequente', texto: 'Vontade frequente de urinar, principalmente à noite' },
    { id: 'sangue_urina_semen', texto: 'Sangue na urina ou no sêmen' },
    { id: 'dor_ossea', texto: 'Dor óssea persistente, principalmente na coluna ou quadril' },
  ],
  fonteResumo: 'SBU/SBOC/SBRT 2023 · INCA/MS 2023',
};
