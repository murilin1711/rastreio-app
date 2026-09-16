import type { CondicaoFamiliar, GrauParentesco, Parentesco, RacaCor, SexoNascimento, TabagismoStatus } from '@core/perfil/tipos';
import type { Opcao } from '@ui/components/Opcoes';

export const OPCOES_SEXO: Opcao<SexoNascimento>[] = [
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'masculino', rotulo: 'Masculino' },
];

export const OPCOES_TABAGISMO: Opcao<TabagismoStatus>[] = [
  { valor: 'nunca', rotulo: 'Nunca fumei' },
  { valor: 'ex', rotulo: 'Já fumei, mas parei' },
  { valor: 'atual', rotulo: 'Fumo atualmente' },
];

export type CondicaoChave = 'temDiabetes' | 'temHipertensao' | 'temDoencaRenal' | 'temImunossupressao' | 'temHiv' | 'temDii' | 'nenhuma';
export const CHAVES_CONDICAO: Exclude<CondicaoChave, 'nenhuma'>[] = ['temDiabetes', 'temHipertensao', 'temDoencaRenal', 'temImunossupressao', 'temHiv', 'temDii'];

export const OPCOES_CONDICOES: Opcao<CondicaoChave>[] = [
  { valor: 'temDiabetes', rotulo: 'Diabetes' },
  { valor: 'temHipertensao', rotulo: 'Pressão alta (hipertensão)' },
  { valor: 'temDoencaRenal', rotulo: 'Doença renal crônica' },
  { valor: 'temImunossupressao', rotulo: 'Imunossupressão', descricao: 'Transplante, quimioterapia, corticoide prolongado' },
  { valor: 'temHiv', rotulo: 'HIV' },
  { valor: 'temDii', rotulo: 'Doença inflamatória intestinal', descricao: 'Crohn ou retocolite ulcerativa' },
  { valor: 'nenhuma', rotulo: 'Nenhuma destas' },
];

export const OPCOES_SIM_NAO: Opcao<'sim' | 'nao'>[] = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'nao', rotulo: 'Não' },
];

export const OPCOES_PARENTESCO: Opcao<Parentesco>[] = [
  { valor: 'mae', rotulo: 'Mãe' },
  { valor: 'pai', rotulo: 'Pai' },
  { valor: 'irma_o', rotulo: 'Irmã ou irmão' },
  { valor: 'filha_o', rotulo: 'Filha ou filho' },
  { valor: 'avo_a', rotulo: 'Avó ou avô' },
  { valor: 'tia_o', rotulo: 'Tia ou tio' },
  { valor: 'outro', rotulo: 'Outro' },
];

/** Grau inferido automaticamente pelo parentesco (o usuário pode ajustar). */
export function grauPorParentesco(p: Parentesco): GrauParentesco | null {
  if (['mae', 'pai', 'irma_o', 'filha_o'].includes(p)) return 'primeiro';
  if (['avo_a', 'tia_o'].includes(p)) return 'segundo';
  return null;
}

export const OPCOES_GRAU: Opcao<GrauParentesco>[] = [
  { valor: 'primeiro', rotulo: '1º grau', descricao: 'Pais, irmãos, filhos' },
  { valor: 'segundo', rotulo: '2º grau', descricao: 'Avós, tios, netos' },
  { valor: 'outro', rotulo: 'Outro' },
];

export const OPCOES_CONDICAO_FAMILIAR: Opcao<CondicaoFamiliar>[] = [
  { valor: 'mama', rotulo: 'Câncer de mama' },
  { valor: 'ovario', rotulo: 'Câncer de ovário' },
  { valor: 'colorretal', rotulo: 'Câncer colorretal (intestino)' },
  { valor: 'prostata', rotulo: 'Câncer de próstata' },
  { valor: 'pulmao', rotulo: 'Câncer de pulmão' },
  { valor: 'colo_utero', rotulo: 'Câncer do colo do útero' },
  { valor: 'dcv_prematura', rotulo: 'Infarto ou AVC precoce', descricao: 'Antes dos 55 anos em homens ou 65 em mulheres' },
  { valor: 'outro', rotulo: 'Outro' },
];

export function rotuloDe<T extends string>(lista: Opcao<T>[], valor: T): string {
  return lista.find((o) => o.valor === valor)?.rotulo ?? valor;
}

/** Autodeclaração de raça/cor (categorias do IBGE). Usada pela SBU para o rastreamento de próstata. */
export const OPCOES_RACA_COR: Opcao<RacaCor>[] = [
  { valor: 'branca', rotulo: 'Branca' },
  { valor: 'preta', rotulo: 'Preta' },
  { valor: 'parda', rotulo: 'Parda' },
  { valor: 'amarela', rotulo: 'Amarela' },
  { valor: 'indigena', rotulo: 'Indígena' },
  { valor: 'nao_informar', rotulo: 'Prefiro não informar' },
];
