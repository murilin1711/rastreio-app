import type { RegraParametros } from '../tipos';
import type { MedidaCorporal, ObjetivoPeso, ParametrosBemEstar, Sexo } from './tipos';

export type FaixaIMC = 'baixo_peso' | 'referencia' | 'sobrepeso' | 'obesidade_1' | 'obesidade_2' | 'obesidade_3';
export const ROTULO_FAIXA_IMC: Record<FaixaIMC, string> = { baixo_peso: 'Baixo peso', referencia: 'Faixa de referência', sobrepeso: 'Sobrepeso', obesidade_1: 'Obesidade grau I', obesidade_2: 'Obesidade grau II', obesidade_3: 'Obesidade grau III' };

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const dia = (iso: string) => iso.slice(0, 10);
const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${dia(b)}T00:00:00Z`) - Date.parse(`${dia(a)}T00:00:00Z`)) / 86_400_000);
const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/** Faixa OMS/ABESO 2016 (Tabela 4). Limites inferiores inclusivos: 18,5 é referência; 25,0 é sobrepeso. */
export function faixaIMC(imc: number, p: ParametrosBemEstar): { faixa: FaixaIMC; rotulo: string; regra: RegraParametros } {
  const c = p.imc;
  const faixa: FaixaIMC = imc < c.baixo ? 'baixo_peso' : imc < c.sobrepeso ? 'referencia' : imc < c.obesidade1 ? 'sobrepeso' : imc < c.obesidade2 ? 'obesidade_1' : imc < c.obesidade3 ? 'obesidade_2' : 'obesidade_3';
  return { faixa, rotulo: ROTULO_FAIXA_IMC[faixa], regra: c.regra };
}

/** Faixa do MS para idosos (ABESO 2016 Rec. 1C): 22–27 referência. null antes da idade mínima. */
export function faixaIMCIdoso(imc: number, idade: number | null, p: ParametrosBemEstar): { faixa: 'baixo_peso' | 'referencia' | 'excesso'; rotulo: string; regra: RegraParametros } | null {
  if (idade == null || idade < p.imcIdoso.idadeMin) return null;
  const faixa = imc < p.imcIdoso.baixo ? 'baixo_peso' : imc > p.imcIdoso.alto ? 'excesso' : 'referencia';
  const rotulo = { baixo_peso: 'Baixo peso (referência para idosos)', referencia: 'Faixa de referência para idosos', excesso: 'Excesso de peso (referência para idosos)' }[faixa];
  return { faixa, rotulo, regra: p.imcIdoso.regra };
}

export function rca(cinturaCm: number, alturaCm: number): number { return r2(cinturaCm / alturaCm); }
export function classificarRCA(v: number, p: ParametrosBemEstar): { acima: boolean; regra: RegraParametros } { return { acima: v > p.rca.limite, regra: p.rca.regra }; }

export function classificarCintura(cm: number, sexo: Sexo, p: ParametrosBemEstar): { faixa: 'referencia' | 'aumentado' | 'muito_aumentado'; regra: RegraParametros } {
  const aumentado = sexo === 'masculino' ? p.cintura.hAumentado : p.cintura.mAumentado;
  const muito = sexo === 'masculino' ? p.cintura.hMuito : p.cintura.mMuito;
  return { faixa: cm >= muito ? 'muito_aumentado' : cm >= aumentado ? 'aumentado' : 'referencia', regra: p.cintura.regra };
}

export function rcq(cinturaCm: number, quadrilCm: number): number { return r2(cinturaCm / quadrilCm); }
export function classificarRCQ(v: number, sexo: Sexo, p: ParametrosBemEstar): { acima: boolean; regra: RegraParametros } { return { acima: v >= (sexo === 'masculino' ? p.rcq.h : p.rcq.m), regra: p.rcq.regra }; }

/**
 * Tendência (C-019): média dos últimos `janelaDias` dias × média dos `janelaDias` anteriores.
 * Exige `minimoMedidas` medidas e pelo menos `janelaDias` entre a primeira e a última; janela anterior vazia → null.
 */
export function tendenciaPeso(pesos: { medidoEm: string; kg: number }[], hoje: string, p: ParametrosBemEstar): 'estavel' | 'aumento' | 'reducao' | null {
  const t = p.tendencia;
  const ordenados = [...pesos].sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
  if (ordenados.length < t.minimoMedidas) return null;
  if (diasEntre(ordenados[0].medidoEm, ordenados[ordenados.length - 1].medidoEm) < t.janelaDias) return null;
  const recente = ordenados.filter((m) => diasEntre(m.medidoEm, hoje) < t.janelaDias);
  const anterior = ordenados.filter((m) => { const d = diasEntre(m.medidoEm, hoje); return d >= t.janelaDias && d < 2 * t.janelaDias; });
  if (!recente.length || !anterior.length) return null;
  const variacao = ((media(recente.map((m) => m.kg)) - media(anterior.map((m) => m.kg))) / media(anterior.map((m) => m.kg))) * 100;
  if (Math.abs(variacao) < t.limiarPct) return 'estavel';
  return variacao > 0 ? 'aumento' : 'reducao';
}

export function evolucaoPercentual(inicialKg: number, atualKg: number): number { return r1(((atualKg - inicialKg) / inicialKg) * 100); }

/** ABESO 2026 R8: obesidade reduzida/controlada pela perda em relação ao peso máximo da vida. `faixa` null fora da faixa de IMC da regra. */
export function avaliarPMAV(pesoAtualKg: number, pmavKg: number, imc: number, p: ParametrosBemEstar): { perdaPct: number; faixa: 'nenhuma' | 'reduzida' | 'controlada' | null; regra: RegraParametros } {
  const perdaPct = r1(((pmavKg - pesoAtualKg) / pmavKg) * 100);
  const c = p.pmav;
  if (imc < c.imcMin || imc > c.imcMax) return { perdaPct, faixa: null, regra: c.regra };
  const [reduzida, controlada] = imc < c.imc2 ? [c.reduzida1, c.controlada1] : [c.reduzida2, c.controlada2];
  const faixa = perdaPct >= controlada ? 'controlada' : perdaPct >= reduzida ? 'reduzida' : 'nenhuma';
  return { perdaPct, faixa, regra: c.regra };
}

/** C-019 (4): sem meta de redução, queda ≥ pct em relação ao maior peso dos últimos `meses` meses. */
export function perdaNaoIntencional(pesos: { medidoEm: string; kg: number }[], objetivo: ObjetivoPeso | null, hoje: string, p: ParametrosBemEstar): { pct: number; desde: string; regra: RegraParametros } | null {
  if (objetivo === 'reducao') return null;
  const ordenados = [...pesos].sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
  if (ordenados.length < 2) return null;
  const atual = ordenados[ordenados.length - 1];
  const janela = ordenados.filter((m) => diasEntre(m.medidoEm, hoje) <= p.perdaNaoIntencional.meses * 30.44 && m !== atual);
  if (!janela.length) return null;
  const maior = janela.reduce((a, b) => (b.kg > a.kg ? b : a));
  const pct = r1(((maior.kg - atual.kg) / maior.kg) * 100);
  return pct >= p.perdaNaoIntencional.pct ? { pct, desde: dia(maior.medidoEm), regra: p.perdaNaoIntencional.regra } : null;
}

/** §73 "Comparar períodos": primeira → última medida de cada indicador dentro do intervalo. */
export function compararPeriodos(medidas: MedidaCorporal[], de: string, ate: string): { peso?: [number, number]; cintura?: [number, number]; gorduraPct?: [number, number]; massaMuscularKg?: [number, number] } {
  const no = medidas.filter((m) => dia(m.medidoEm) >= de && dia(m.medidoEm) <= ate).sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
  const par = (sel: (m: MedidaCorporal) => number | undefined): [number, number] | undefined => {
    const vs = no.map(sel).filter((v): v is number => v != null);
    return vs.length ? [vs[0], vs[vs.length - 1]] : undefined;
  };
  const out: ReturnType<typeof compararPeriodos> = {};
  const peso = par((m) => (m.tipo === 'peso' ? m.valores.kg : undefined)); if (peso) out.peso = peso;
  const cintura = par((m) => (m.tipo === 'cintura' ? m.valores.cm : undefined)); if (cintura) out.cintura = cintura;
  const gordura = par((m) => (m.tipo === 'composicao' ? m.valores.gordura_pct : undefined)); if (gordura) out.gorduraPct = gordura;
  const musculo = par((m) => (m.tipo === 'composicao' ? m.valores.massa_muscular_kg : undefined)); if (musculo) out.massaMuscularKg = musculo;
  return out;
}
