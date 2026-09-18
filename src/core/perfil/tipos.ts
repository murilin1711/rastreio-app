export type SexoNascimento = 'feminino' | 'masculino';
export type TabagismoStatus = 'nunca' | 'ex' | 'atual';
export type TipoDiabetes = 'dm1' | 'dm2' | 'gestacional' | 'outro';
export type UsoInsulina = 'nao' | 'basal' | 'intensiva';
export type PerfilMetaGlicemica = 'adulto' | 'idoso_comprometido' | 'idoso_muito_comprometido';
export type MomentoGlicemia = 'jejum' | 'antes_cafe' | 'pos_cafe_1h' | 'pos_cafe_2h' | 'antes_almoco' | 'pos_almoco_1h' | 'pos_almoco_2h' | 'antes_jantar' | 'pos_jantar_1h' | 'pos_jantar_2h' | 'antes_dormir' | 'madrugada' | 'antes_exercicio' | 'depois_exercicio' | 'sintomas_hipoglicemia' | 'aleatoria' | 'outro';
/** Metas de glicemia capilar (§7, C-012). `definidasPor: 'diretriz'` = usar a Tabela 1 da SBD 2026 pelo perfil. */
export interface MetasGlicemia { definidasPor: 'medico' | 'outro_profissional' | 'diretriz'; jejumMin: number; jejumMax: number; posMax: number | null; deitarMin: number; deitarMax: number }
/** Plano de monitorização (§7). */
export interface PlanoGlicemia { definidoPor: 'medico' | 'outro_profissional' | 'nenhum'; modelo: 'dm1_sem_sensor' | 'dm2_basal' | 'dm2_intensiva' | 'dm2_sem_insulina' | null; horarios: { momento: MomentoGlicemia; hora: string }[] }
/** Fatores agravantes — Diretriz de Dislipidemias 2025, Tabela 4.3 (C-013). */
export type AgravanteCV = 'hist_familiar_dcv_prematura' | 'sindrome_metabolica' | 'esteatose_hepatica' | 'artrite_reumatoide' | 'psoriase' | 'lupus' | 'dii' | 'hiv' | 'transplante' | 'menarca_precoce_ou_tardia' | 'disturbio_gestacional' | 'parto_prematuro' | 'rciu' | 'abortos_repeticao' | 'menopausa_precoce' | 'lpa_elevada' | 'pcr_us_elevada';
/** Preferências de notificação (D-010): desligar só cancela avisos do celular; itens do app permanecem. */
export interface PreferenciasLembretes { exame: boolean; mrpa: boolean; glicemia: boolean; medicacao: boolean; consulta: boolean; atualizacao: boolean }
export const PREFERENCIAS_PADRAO: PreferenciasLembretes = { exame: true, mrpa: true, glicemia: true, medicacao: true, consulta: true, atualizacao: true };
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
  /** Fase 2 — Coração & Metabolismo (C-012, C-013). */
  tipoDiabetes: TipoDiabetes | null;
  usaInsulina: UsoInsulina | null;
  eventoCvPrevio: boolean | null;
  perfilMetaGlicemica: PerfilMetaGlicemica;
  metasGlicemia: MetasGlicemia | null;
  planoGlicemia: PlanoGlicemia | null;
  agravantesCv: { itens: AgravanteCV[]; atualizadoEm: string | null };
  atividadeFisicaRegular: boolean | null;
  preferenciasLembretes: PreferenciasLembretes;
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
