import type { RegraParametros } from '../tipos';
import type { ParametrosGlicemia, PerfilMeta, SintomaGlicemia } from './tiposGlicemia';

function porCamada(regras: RegraParametros[], camada: string, extra?: (c: Record<string, unknown>) => boolean): RegraParametros {
  const r = regras.find((x) => x.condicao.camada === camada && (!extra || extra(x.condicao)));
  if (!r) throw new Error(`regras_clinicas: falta a camada "${camada}" do programa glicemia`);
  return r;
}
const n = (c: Record<string, unknown>, k: string): number => Number(c[k]);

/** Lê as regras de `regras_clinicas` (programa 'glicemia') em um objeto tipado. */
export function extrairParametrosGlicemia(regras: RegraParametros[]): ParametrosGlicemia {
  const meta = (perfil: PerfilMeta) => {
    const r = porCamada(regras, 'metas', (c) => c.perfil === perfil);
    return { jejum: r.condicao.jejum as [number, number], pos: (r.condicao.pos as number | null) ?? null, deitar: r.condicao.deitar as [number, number], regra: r };
  };
  const h1 = porCamada(regras, 'hipo_n1');
  const h2 = porCamada(regras, 'hipo_n2');
  const h3 = porCamada(regras, 'hipo_n3');
  const hi = porCamada(regras, 'hiper');
  const hs = porCamada(regras, 'hiper_sintoma');
  const sd = porCamada(regras, 'sem_diabetes');
  return {
    metas: { adulto: meta('adulto'), idoso_comprometido: meta('idoso_comprometido'), idoso_muito_comprometido: meta('idoso_muito_comprometido') },
    hipoN1: { min: n(h1.condicao, 'min'), max: n(h1.condicao, 'max'), regra: h1 },
    hipoN2: { max: n(h2.condicao, 'max'), regra: h2 },
    hipoN3: { sintomas: (h3.condicao.sintomas as SintomaGlicemia[]) ?? [], regra: h3 },
    hiper: { min: n(hi.condicao, 'min'), regra: hi },
    hiperSintoma: { min: n(hs.condicao, 'min'), sintomas: (hs.condicao.sintomas as SintomaGlicemia[]) ?? [], regra: hs },
    semDiabetes: { jejumNormalMax: n(sd.condicao, 'jejum_normal_max'), jejumPreMax: n(sd.condicao, 'jejum_pre_max'), jejumDm: n(sd.condicao, 'jejum_dm'), casualDm: n(sd.condicao, 'casual_dm'), regra: sd },
  };
}
