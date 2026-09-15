export type SexoNascimento = 'feminino' | 'masculino';
export type TabagismoStatus = 'nunca' | 'ex' | 'atual';
export type RacaCor = 'branca' | 'preta' | 'parda' | 'amarela' | 'indigena' | 'nao_informar';

/** Perfil de Saúde único (§64) — tipo de domínio em camelCase; o mapeamento para o banco fica em mapeamento.ts. */
export interface PerfilSaude {
  userId: string;
  nome: string;
  dataNascimento: string | null; // 'AAAA-MM-DD'
  sexoNascimento: SexoNascimento | null;
  possuiColoUtero: boolean | null;
  histerectomia: boolean | null;
  alturaCm: number | null;
  tabagismoStatus: TabagismoStatus | null;
  cigarrosDia: number | null;
  anosFumando: number | null;
  dataCessacao: string | null;
  temDiabetes: boolean | null;
  temHipertensao: boolean | null;
  temDoencaRenal: boolean | null;
  temImunossupressao: boolean | null;
  temHiv: boolean | null;
  temDii: boolean | null;
  historicoCancerPessoal: { tipo: string; ano?: number }[];
  lesoesPrecursoras: { tipo: string; ano?: number }[];
  doencasGeneticas: { nome: string }[];
  radioterapiaToracica: boolean | null;
  /** Exigidos pelas diretrizes do Rastreando (INCA 2025 Rec. 36; SBU). */
  jaTeveAtividadeSexual: boolean | null;
  racaCor: RacaCor | null;
  menopausa: boolean | null;
  /** Declarações negativas — são dado clínico, não ausência de dado. */
  semMedicacoes: boolean;
  semAntecedentesFamiliares: boolean;
  perfilInicialCompleto: boolean;
}

export type Parentesco = 'mae' | 'pai' | 'irma_o' | 'filha_o' | 'avo_a' | 'tia_o' | 'outro';
export type GrauParentesco = 'primeiro' | 'segundo' | 'outro';
export type CondicaoFamiliar = 'mama' | 'ovario' | 'colorretal' | 'prostata' | 'pulmao' | 'colo_utero' | 'dcv_prematura' | 'outro';

export interface AntecedenteFamiliar {
  id: string;
  parentesco: Parentesco;
  grau: GrauParentesco;
  condicao: CondicaoFamiliar;
  idadeDiagnostico: number | null;
  observacao: string | null;
}
