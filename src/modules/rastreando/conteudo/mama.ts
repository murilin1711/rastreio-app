import type { ConteudoPrograma } from './tipos';

export const mama: ConteudoPrograma = {
  titulo: 'Câncer de mama',
  subtitulo: 'Rastreamento com mamografia',
  icone: 'ribbon-outline',
  capa: ['#B83280', '#F06FB0'],
  entenda: [
    'O câncer de mama é o mais comum entre mulheres no Brasil, depois do câncer de pele. Descoberto cedo, as chances de tratamento com sucesso são muito altas.',
    'A mamografia consegue encontrar alterações antes de qualquer sintoma. Por isso é o exame usado no rastreamento de quem não tem queixas.',
    'As sociedades brasileiras de mastologia, radiologia e ginecologia recomendam mamografia anual dos 40 aos 74 anos para mulheres de risco habitual. A partir dos 75, a decisão é individual, com o médico.',
    'Quem tem risco aumentado (por exemplo, mutação genética ou forte história familiar) pode precisar começar antes e acrescentar ressonância. Nesses casos, o protocolo é definido com o mastologista.',
  ],
  noSus: 'Pelo SUS, a mamografia de rastreamento é oferecida a cada dois anos dos 50 aos 74 anos. Entre 40 e 49 anos, ela pode ser feita por decisão compartilhada com o profissional de saúde (Ministério da Saúde, 2025).',
  fatoresEducativos: [
    'Idade acima de 50 anos',
    'Obesidade após a menopausa',
    'Sedentarismo',
    'Consumo de bebida alcoólica',
    'Primeira gestação após os 30 anos ou não ter tido filhos',
    'Reposição hormonal por tempo prolongado',
    'Primeira menstruação muito cedo ou menopausa tardia',
  ],
  fatoresModificadores: [
    'Mutação em BRCA1, BRCA2, TP53 ou outros genes de risco',
    'Mãe, irmã ou filha com câncer de mama, especialmente antes dos 50 anos',
    'Câncer de ovário na família ou câncer de mama em homem da família',
    'Radioterapia no tórax antes dos 30 anos',
    'Biópsia anterior com hiperplasia atípica ou carcinoma lobular in situ',
    'Câncer de mama já tratado',
  ],
  sinaisAlerta: [
    { id: 'nodulo_mamario', texto: 'Nódulo ou caroço na mama ou na axila' },
    { id: 'descarga_papilar', texto: 'Saída de líquido pelo mamilo, principalmente com sangue' },
    { id: 'retracao_pele', texto: 'Pele da mama enrugada, retraída ou com aspecto de casca de laranja' },
    { id: 'alteracao_mamilo', texto: 'Mamilo retraído ou com ferida que não cicatriza' },
    { id: 'vermelhidao_mama', texto: 'Vermelhidão, inchaço ou calor na mama sem causa aparente' },
  ],
  fonteResumo: 'CBR/SBM/FEBRASGO 2023 · Nota Técnica CNM 2025 · Ministério da Saúde 2025',
};
