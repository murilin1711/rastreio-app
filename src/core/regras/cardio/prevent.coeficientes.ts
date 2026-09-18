/**
 * Coeficientes das equações PREVENT (Khan et al., Circulation 2024 — material suplementar).
 * TRANSCRIÇÃO PENDENTE: aguarda os PDFs em docs/nero/referencias/pdf/ (plano 2b, Task 4).
 * Enquanto `DISPONIVEL` for false, `calcularPrevent` recusa calcular — o app nunca mostra um número inventado.
 */
export const VERSAO_COEFICIENTES = 'khan-2024-suppl';
export const DISPONIVEL = false;

export type ModeloPrevent = 'prevent_base' | 'prevent_hba1c' | 'prevent_rac' | 'prevent_hba1c_rac';
export type Sexo = 'feminino' | 'masculino';
export type Horizonte = '10' | '30';

export interface Coeficientes {
  intercepto: number;
  idade: number;
  naoHdl: number;
  hdl: number;
  pasBaixa: number;
  pasAlta: number;
  diabetes: number;
  tabagismo: number;
  tfgBaixa: number;
  tfgAlta: number;
  antiHipertensivo: number;
  estatina: number;
  antiHipertensivoXpasAlta: number;
  estatinaXnaoHdl: number;
  idadeXnaoHdl: number;
  idadeXhdl: number;
  idadeXpasAlta: number;
  idadeXdiabetes: number;
  idadeXtabagismo: number;
  idadeXtfgBaixa: number;
  hba1cComDiabetes?: number;
  hba1cSemDiabetes?: number;
  rac?: number;
}

/** Preenchido na Task 4 a partir das tabelas suplementares (desfecho ASCVD, por sexo e horizonte). */
export const COEFICIENTES: Partial<Record<ModeloPrevent, Partial<Record<Sexo, Partial<Record<Horizonte, Coeficientes>>>>>> = {};
