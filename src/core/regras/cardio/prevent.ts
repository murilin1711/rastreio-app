/**
 * PREVENT — AHA (Khan 2023/2024), adotado pela Diretriz Brasileira de Dislipidemias 2025 (C-013).
 * Elegibilidade e categorias vêm da diretriz brasileira; a equação vem do suplemento de Khan 2024.
 */
import { COEFICIENTES, DISPONIVEL, VERSAO_COEFICIENTES, type Coeficientes, type ModeloPrevent } from './prevent.coeficientes';
import type { ParametrosRisco } from './tiposRisco';

export interface EntradasPrevent {
  sexo: 'feminino' | 'masculino';
  idade: number;
  colesterolTotal: number; // mg/dL
  hdl: number; // mg/dL
  pas: number;
  antiHipertensivo: boolean;
  estatina: boolean;
  diabetes: boolean;
  tabagismoAtual: boolean;
  imc: number;
  tfg: number;
  hba1c?: number;
  rac?: number;
}

export interface ResultadoPrevent { ascvd10: number; ascvd30: number | null; modelo: ModeloPrevent; versaoCoeficientes: string }

export class CoeficientesIndisponiveis extends Error {
  constructor() { super('Os coeficientes do PREVENT ainda não foram transcritos do material suplementar de Khan 2024.'); }
}

export function elegivelPrevent(perfil: { idade: number | null; eventoCvPrevio: boolean | null }, p: ParametrosRisco): { ok: boolean; motivo: 'idade' | 'evento_previo' | 'sem_idade' | null } {
  if (perfil.idade == null) return { ok: false, motivo: 'sem_idade' };
  if (perfil.eventoCvPrevio) return { ok: false, motivo: 'evento_previo' };
  if (perfil.idade < p.elegibilidade.idadeMin || perfil.idade > p.elegibilidade.idadeMax) return { ok: false, motivo: 'idade' };
  return { ok: true, motivo: null };
}

/** Tabela 4.1 da Dislipidemias 2025: < 5 % baixo · 5 a < 20 % intermediário · ≥ 20 % alto. */
export function categoriaPrevent(ascvd10: number, p: ParametrosRisco): 'baixo' | 'intermediario' | 'alto' {
  if (ascvd10 < p.categorias.baixoMax) return 'baixo';
  if (ascvd10 < p.categorias.altoMin) return 'intermediario';
  return 'alto';
}

export function modeloPara(e: EntradasPrevent): ModeloPrevent {
  if (e.hba1c != null && e.rac != null) return 'prevent_hba1c_rac';
  if (e.hba1c != null) return 'prevent_hba1c';
  if (e.rac != null) return 'prevent_rac';
  return 'prevent_base';
}

const MGDL_PARA_MMOL = 0.02586;

/** Só para testes de validação contra o suplemento (o app usa sempre 'ausente' — o SDI é um índice de CEP dos EUA). */
export type SdiTeste = 'ausente' | '1-3' | '4-6' | '7-10';

/** Logit do PREVENT com as transformações de Khan 2024 (Apêndice 4 do suplemento; centragens da Tabela S12). */
export function logitPrevent(e: EntradasPrevent, c: Coeficientes, sdi: SdiTeste = 'ausente'): number {
  const idade = (e.idade - 55) / 10;
  const naoHdl = (e.colesterolTotal - e.hdl) * MGDL_PARA_MMOL - 3.5;
  const hdl = (e.hdl * MGDL_PARA_MMOL - 1.3) / 0.3;
  const pasBaixa = (Math.min(e.pas, 110) - 110) / 20;
  const pasAlta = (Math.max(e.pas, 110) - 130) / 20;
  const tfgBaixa = (Math.min(e.tfg, 60) - 60) / -15;
  const tfgAlta = (Math.max(e.tfg, 60) - 90) / -15;
  const dm = e.diabetes ? 1 : 0;
  const fumo = e.tabagismoAtual ? 1 : 0;
  const ah = e.antiHipertensivo ? 1 : 0;
  const est = e.estatina ? 1 : 0;
  let l = c.intercepto + c.idade * idade + (c.idade2 ?? 0) * idade * idade
    + c.naoHdl * naoHdl + c.hdl * hdl + c.pasBaixa * pasBaixa + c.pasAlta * pasAlta
    + c.diabetes * dm + c.tabagismo * fumo + c.tfgBaixa * tfgBaixa + c.tfgAlta * tfgAlta
    + c.antiHipertensivo * ah + c.estatina * est
    + c.antiHipertensivoXpasAlta * ah * pasAlta + c.estatinaXnaoHdl * est * naoHdl
    + c.idadeXnaoHdl * idade * naoHdl + c.idadeXhdl * idade * hdl + c.idadeXpasAlta * idade * pasAlta
    + c.idadeXdiabetes * idade * dm + c.idadeXtabagismo * idade * fumo + c.idadeXtfgBaixa * idade * tfgBaixa;
  // Variáveis dos modelos ampliados (Tabelas S12B/C/E): HbA1c centrada em 5,3 por status de diabetes; ln(RAC) sem centragem.
  if (c.hba1cComDiabetes != null && c.hba1cSemDiabetes != null) {
    if (e.hba1c != null) l += (e.diabetes ? c.hba1cComDiabetes : c.hba1cSemDiabetes) * (e.hba1c - 5.3);
    else l += c.hba1cAusente ?? 0;
  }
  if (c.lnRac != null) {
    if (e.rac != null) l += c.lnRac * Math.log(Math.max(e.rac, 0.1));
    else l += c.racAusente ?? 0;
  }
  if (c.sdiAusente != null) {
    l += sdi === '4-6' ? (c.sdi4a6 ?? 0) : sdi === '7-10' ? (c.sdi7a10 ?? 0) : sdi === 'ausente' ? c.sdiAusente : 0;
  }
  return l;
}

const risco = (l: number) => Math.round((Math.exp(l) / (1 + Math.exp(l))) * 1000) / 10;

export function calcularPrevent(e: EntradasPrevent, sdiTeste: SdiTeste = 'ausente'): ResultadoPrevent {
  if (!DISPONIVEL) throw new CoeficientesIndisponiveis();
  const modelo = modeloPara(e);
  const c10 = COEFICIENTES[modelo]?.[e.sexo]?.['10'];
  if (!c10) throw new CoeficientesIndisponiveis();
  // 30 anos: o PREVENT estima para 30–59 anos (Khan 2024)
  const c30 = e.idade <= 59 ? COEFICIENTES[modelo]?.[e.sexo]?.['30'] : undefined;
  return { ascvd10: risco(logitPrevent(e, c10, sdiTeste)), ascvd30: c30 ? risco(logitPrevent(e, c30, sdiTeste)) : null, modelo, versaoCoeficientes: VERSAO_COEFICIENTES };
}
