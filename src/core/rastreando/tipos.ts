import type { Programa } from '@core/regras/tipos';

export type TipoExameRastreamento = 'mamografia' | 'dna_hpv' | 'citologia' | 'colposcopia' | 'fit' | 'colonoscopia' | 'tcbd' | 'psa';

export const PROGRAMAS: Programa[] = ['mama', 'colo_utero', 'colorretal', 'pulmao', 'prostata'];

export const TIPOS_POR_PROGRAMA: Record<Programa, TipoExameRastreamento[]> = {
  mama: ['mamografia'],
  colo_utero: ['dna_hpv', 'citologia', 'colposcopia'],
  colorretal: ['fit', 'colonoscopia'],
  pulmao: ['tcbd'],
  prostata: ['psa'],
};

export const ROTULO_EXAME: Record<TipoExameRastreamento, string> = {
  mamografia: 'Mamografia',
  dna_hpv: 'Teste de DNA-HPV',
  citologia: 'Citologia (Papanicolau)',
  colposcopia: 'Colposcopia',
  fit: 'Teste de sangue oculto nas fezes (FIT)',
  colonoscopia: 'Colonoscopia',
  tcbd: 'Tomografia de baixa dose',
  psa: 'PSA',
};

export const ROTULO_PROGRAMA: Record<Programa, string> = {
  mama: 'Mama',
  colo_utero: 'Colo do útero',
  colorretal: 'Intestino (colorretal)',
  pulmao: 'Pulmão',
  prostata: 'Próstata',
};
