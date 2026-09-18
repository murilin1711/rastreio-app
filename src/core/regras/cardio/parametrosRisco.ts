import type { RegraParametros } from '../tipos';
import type { ParametrosRisco } from './tiposRisco';

function porCamada(regras: RegraParametros[], camada: string): RegraParametros {
  const r = regras.find((x) => x.condicao.camada === camada);
  if (!r) throw new Error(`regras_clinicas: falta a camada "${camada}" do programa risco_cv`);
  return r;
}
const n = (c: Record<string, unknown>, k: string): number => Number(c[k]);

/** Lê as regras de `regras_clinicas` (programa 'risco_cv') em um objeto tipado. */
export function extrairParametrosRisco(regras: RegraParametros[]): ParametrosRisco {
  const cat = porCamada(regras, 'categorias');
  const el = porCamada(regras, 'elegibilidade');
  const cac = porCamada(regras, 'cac');
  const dr = porCamada(regras, 'dado_recente');
  const c = dr.condicao;
  return {
    categorias: { baixoMax: n(cat.condicao, 'baixo_max'), altoMin: n(cat.condicao, 'alto_min'), regra: cat },
    elegibilidade: { idadeMin: n(el.condicao, 'idade_min'), idadeMax: n(el.condicao, 'idade_max'), regra: el },
    cac: { alto: n(cac.condicao, 'alto'), percentilAlto: n(cac.condicao, 'percentil_alto'), muitoAlto: n(cac.condicao, 'muito_alto'), regra: cac },
    dadoRecente: { paMrpaDias: n(c, 'pa_mrpa_dias'), paCasualDias: n(c, 'pa_casual_dias'), paCasualMin: n(c, 'pa_casual_min'), pesoDias: n(c, 'peso_dias'), pesoPerguntarDias: n(c, 'peso_perguntar_dias'), lipidiosMeses: n(c, 'lipidios_meses'), renalMeses: n(c, 'renal_meses'), hba1cMeses: n(c, 'hba1c_meses'), racMeses: n(c, 'rac_meses'), riscoMeses: n(c, 'risco_meses'), regra: dr },
  };
}
