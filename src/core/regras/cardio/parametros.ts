import type { RegraParametros } from '../tipos';
import type { ParametrosPressao, SintomaPA } from './tipos';

function porCamada(regras: RegraParametros[], camada: string): RegraParametros {
  const r = regras.find((x) => x.condicao.camada === camada);
  if (!r) throw new Error(`regras_clinicas: falta a camada "${camada}" do programa pressao`);
  return r;
}
const n = (c: Record<string, unknown>, k: string): number => Number(c[k]);

/** Lê as sete camadas de `regras_clinicas` (programa 'pressao') em um objeto tipado. */
export function extrairParametros(regras: RegraParametros[]): ParametrosPressao {
  const imp = porCamada(regras, 'implausivel');
  const ref = porCamada(regras, 'referencia_domiciliar');
  const conv = porCamada(regras, 'convite_mrpa');
  const alto = porCamada(regras, 'muito_elevado');
  const altoS = porCamada(regras, 'muito_elevado_sintoma');
  const acima = porCamada(regras, 'mrpa_acima');
  const val = porCamada(regras, 'validade');
  return {
    implausivel: { padMax: n(imp.condicao, 'pad_max'), padMin: n(imp.condicao, 'pad_min'), pasMin: n(imp.condicao, 'pas_min'), pasMax: n(imp.condicao, 'pas_max'), ppMin: n(imp.condicao, 'pp_min'), ppMax: n(imp.condicao, 'pp_max'), regra: imp },
    referenciaDomiciliar: { pas: n(ref.condicao, 'pas'), pad: n(ref.condicao, 'pad'), regra: ref },
    conviteMrpa: { minimoMedidas: n(conv.condicao, 'minimo_medidas'), janelaDias: n(conv.condicao, 'janela_dias'), repetirDias: n(conv.condicao, 'repetir_dias'), pas: n(conv.condicao, 'pas'), pad: n(conv.condicao, 'pad'), regra: conv },
    muitoElevado: { pas: n(alto.condicao, 'pas'), pad: n(alto.condicao, 'pad'), regra: alto },
    muitoElevadoSintoma: { pas: n(altoS.condicao, 'pas'), pad: n(altoS.condicao, 'pad'), sintomas: (altoS.condicao.sintomas as SintomaPA[]) ?? [], regra: altoS },
    mrpaAcima: { pas: n(acima.condicao, 'pas'), pad: n(acima.condicao, 'pad'), regra: acima },
    validade: { minimos: (val.condicao.minimos as Record<string, number>) ?? {}, medidasPorPeriodo: n(val.condicao, 'medidas_por_periodo'), intervaloMin: n(val.condicao, 'intervalo_min'), diasMin: n(val.condicao, 'dias_min'), diasMax: n(val.condicao, 'dias_max'), diasPadrao: n(val.condicao, 'dias_padrao'), regra: val },
  };
}
