import type { RegraParametros } from '../tipos';
import type { ParametrosBemEstar } from './tipos';

function porCamada(regras: RegraParametros[], camada: string): RegraParametros {
  const r = regras.find((x) => x.condicao.camada === camada);
  if (!r) throw new Error(`regras_clinicas: falta a camada "${camada}" do programa bem_estar`);
  return r;
}
const n = (c: Record<string, unknown>, k: string): number => Number(c[k]);

/** Lê as regras de `regras_clinicas` (programa 'bem_estar') em um objeto tipado — mesmo padrão de `parametrosRisco.ts`. */
export function extrairParametrosBemEstar(regras: RegraParametros[]): ParametrosBemEstar {
  const imc = porCamada(regras, 'faixas'); const idoso = porCamada(regras, 'idoso'); const cin = porCamada(regras, 'cintura');
  const rca = porCamada(regras, 'rca'); const rcq = porCamada(regras, 'rcq'); const tec = porCamada(regras, 'tecnica');
  const at = porCamada(regras, 'meta'); const so = porCamada(regras, 'duracao'); const te = porCamada(regras, 'tendencia');
  const pm = porCamada(regras, 'pmav'); const pe = porCamada(regras, 'perda_nao_intencional'); const vi = porCamada(regras, 'janela');
  return {
    imc: { baixo: n(imc.condicao, 'baixo'), sobrepeso: n(imc.condicao, 'sobrepeso'), obesidade1: n(imc.condicao, 'obesidade_1'), obesidade2: n(imc.condicao, 'obesidade_2'), obesidade3: n(imc.condicao, 'obesidade_3'), regra: imc },
    imcIdoso: { idadeMin: n(idoso.condicao, 'idade_min'), baixo: n(idoso.condicao, 'baixo'), alto: n(idoso.condicao, 'alto'), regra: idoso },
    cintura: { hAumentado: n(cin.condicao, 'h_aumentado'), mAumentado: n(cin.condicao, 'm_aumentado'), hMuito: n(cin.condicao, 'h_muito'), mMuito: n(cin.condicao, 'm_muito'), regra: cin },
    rca: { limite: n(rca.condicao, 'limite'), regra: rca },
    rcq: { h: n(rcq.condicao, 'h'), m: n(rcq.condicao, 'm'), regra: rcq },
    tecnica: { regra: tec },
    atividade: { moderadaMin: n(at.condicao, 'moderada_min'), moderadaMax: n(at.condicao, 'moderada_max'), vigorosaMin: n(at.condicao, 'vigorosa_min'), vigorosaMax: n(at.condicao, 'vigorosa_max'), fatorVigorosa: n(at.condicao, 'fator_vigorosa'), fortalecimentoDias: n(at.condicao, 'fortalecimento_dias'), idosoIdade: n(at.condicao, 'idoso_idade'), equilibrioDias: n(at.condicao, 'equilibrio_dias'), regra: at },
    sono: { minimoMin: n(so.condicao, 'minimo_min'), maximoIncertoMin: n(so.condicao, 'maximo_incerto_min'), regra: so },
    tendencia: { minimoMedidas: n(te.condicao, 'minimo_medidas'), janelaDias: n(te.condicao, 'janela_dias'), limiarPct: n(te.condicao, 'limiar_pct'), regra: te },
    pmav: { imcMin: n(pm.condicao, 'imc_min'), imc2: n(pm.condicao, 'imc_2'), imcMax: n(pm.condicao, 'imc_max'), reduzida1: n(pm.condicao, 'reduzida_1'), controlada1: n(pm.condicao, 'controlada_1'), reduzida2: n(pm.condicao, 'reduzida_2'), controlada2: n(pm.condicao, 'controlada_2'), regra: pm },
    perdaNaoIntencional: { pct: n(pe.condicao, 'pct'), meses: n(pe.condicao, 'meses'), regra: pe },
    vinculo: { horas: n(vi.condicao, 'horas'), regra: vi },
  };
}
