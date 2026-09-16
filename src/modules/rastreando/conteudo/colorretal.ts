import type { ConteudoPrograma } from './tipos';

export const colorretal: ConteudoPrograma = {
  titulo: 'Câncer colorretal',
  subtitulo: 'Rastreamento do intestino com teste de fezes',
  icone: 'ellipse-outline',
  capa: ['#B45309', '#F59E0B'],
  entenda: [
    'O câncer colorretal (intestino grosso e reto) é um dos mais frequentes no Brasil. Ele costuma começar como pólipos, que levam anos para se transformar e podem ser removidos antes disso.',
    'O teste imunoquímico fecal (FIT) procura sangue invisível nas fezes. É simples, feito em casa, e não exige preparo.',
    'A diretriz brasileira recomenda o FIT a cada 2 anos, dos 50 aos 74 anos, para quem não tem sintomas nem fatores de risco especiais.',
    'Um FIT positivo não significa câncer: significa que é preciso olhar o intestino com colonoscopia. Se a colonoscopia for completa e normal, não é preciso repetir nem fazer FIT por 10 anos.',
  ],
  noSus: 'O rastreamento organizado com FIT foi aprovado para o SUS em 2026 e está em fase de implantação.',
  fatoresEducativos: [
    'Idade acima de 50 anos',
    'Alimentação pobre em fibras e rica em carnes processadas',
    'Obesidade e sedentarismo',
    'Tabagismo e consumo de álcool',
  ],
  fatoresModificadores: [
    'Pai, mãe, irmão ou filho com câncer colorretal, especialmente antes dos 60 anos',
    'Dois ou mais parentes de primeiro grau com câncer colorretal',
    'Doença de Crohn ou retocolite ulcerativa',
    'Síndrome de Lynch, polipose adenomatosa familiar ou outra síndrome hereditária',
    'Pólipo adenomatoso ou câncer colorretal já tratados',
  ],
  sinaisAlerta: [
    { id: 'sangue_fezes', texto: 'Sangue nas fezes ou no papel higiênico' },
    { id: 'mudanca_habito_intestinal', texto: 'Mudança persistente no hábito intestinal (diarreia ou constipação por semanas)' },
    { id: 'emagrecimento', texto: 'Emagrecimento sem causa aparente' },
    { id: 'anemia', texto: 'Anemia sem explicação' },
    { id: 'dor_abdominal', texto: 'Dor ou desconforto abdominal persistente' },
  ],
  fonteResumo: 'CONITEC 2026 · ACG 2021 (história familiar)',
};
