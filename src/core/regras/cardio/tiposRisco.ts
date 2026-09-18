/** Risco cardiovascular — PREVENT (§13–§18, C-013), dado recente (C-014), check-up (§24). TypeScript puro. */
import type { RegraParametros } from '../tipos';

export type AgravanteCV = 'hist_familiar_dcv_prematura' | 'sindrome_metabolica' | 'esteatose_hepatica' | 'artrite_reumatoide' | 'psoriase' | 'lupus' | 'dii' | 'hiv' | 'transplante' | 'menarca_precoce_ou_tardia' | 'disturbio_gestacional' | 'parto_prematuro' | 'rciu' | 'abortos_repeticao' | 'menopausa_precoce' | 'lpa_elevada' | 'pcr_us_elevada';

export interface ParametrosRisco {
  categorias: { baixoMax: number; altoMin: number; regra: RegraParametros };
  elegibilidade: { idadeMin: number; idadeMax: number; regra: RegraParametros };
  cac: { alto: number; percentilAlto: number; muitoAlto: number; regra: RegraParametros };
  dadoRecente: { paMrpaDias: number; paCasualDias: number; paCasualMin: number; pesoDias: number; pesoPerguntarDias: number; lipidiosMeses: number; renalMeses: number; hba1cMeses: number; racMeses: number; riscoMeses: number; regra: RegraParametros };
}

export type TipoDado = 'pa_mrpa' | 'pa_casual' | 'peso' | 'lipidios' | 'renal' | 'hba1c' | 'rac' | 'risco';
export type EstadoDado = 'atual' | 'antigo' | 'faltando';
export type OrigemDado = 'perfil' | 'medida' | 'exame' | 'medicacao' | 'digitado';
export type ChavePrevent = 'idade' | 'sexo' | 'colesterolTotal' | 'hdl' | 'pas' | 'antiHipertensivo' | 'estatina' | 'diabetes' | 'tabagismo' | 'imc' | 'tfg' | 'hba1c' | 'rac';

export interface DadoComData<T> { valor: T; data: string | null; origem: OrigemDado }

/** O que os serviços conseguem reunir do banco para o PREVENT (§14). */
export interface FontesPrevent {
  idade: number | null;
  sexo: 'feminino' | 'masculino' | null;
  colesterolTotal: DadoComData<number> | null;
  hdl: DadoComData<number> | null;
  paMrpa: DadoComData<number> | null;      // média sistólica de MRPA válida
  paCasual: { media: number; n: number; dataMaisRecente: string } | null; // últimos `paCasualDias`
  antiHipertensivo: DadoComData<boolean> | null;
  estatina: DadoComData<boolean> | null;
  diabetes: boolean | null;
  tabagismoAtual: boolean | null;
  peso: DadoComData<number> | null;
  alturaCm: number | null;
  tfg: DadoComData<number> | null;
  creatinina: DadoComData<number> | null;
  hba1c: DadoComData<number> | null;
  rac: DadoComData<number> | null;
}

export interface EntradaPrevent {
  chave: ChavePrevent;
  rotulo: string;
  valor: number | boolean | string | null;
  unidade: string | null;
  data: string | null;
  origem: OrigemDado | null;
  estado: EstadoDado;
  obrigatoria: boolean;
}

export interface FontesCheckup {
  pa: { data: string | null; ehMrpa: boolean; nCasual7d: number };
  peso: string | null;
  tabagismoAtualizadoEm: string | null;
  glicemiaOuHba1c: string | null;
  lipidios: string | null;
  renal: string | null;
  atividadeFisica: string | null;
  risco: string | null;
}
export interface ItemCheckup { chave: 'pa' | 'peso' | 'tabagismo' | 'glicemia_hba1c' | 'lipidios' | 'renal' | 'atividade' | 'risco'; rotulo: string; atualizado: boolean; naoSeAplica?: boolean; frase: string }
