/**
 * Glicemia — C-012. Metas da SBD 2026 (Tabela 1), níveis de hipoglicemia, hiperglicemia > 250 (dias de doença),
 * contexto para quem não tem diabetes (Diagnóstico R1–R2). Fora da meta é educativo (§16), sem cor de alerta.
 */
import type { RegraParametros } from '../tipos';
import type { AvaliacaoGlicemia, CamadaGlicemia, MedidaGlicemia, Metas, ModeloPlano, MomentoGlicemia, ParametrosGlicemia, PerfilGlicemia, ResumoGlicemia, SintomaGlicemia } from './tiposGlicemia';

export const JEJUM: MomentoGlicemia[] = ['jejum'];
export const PRE: MomentoGlicemia[] = ['antes_cafe', 'antes_almoco', 'antes_jantar'];
export const POS2H: MomentoGlicemia[] = ['pos_cafe_2h', 'pos_almoco_2h', 'pos_jantar_2h'];
export const DEITAR: MomentoGlicemia[] = ['antes_dormir'];

export function metasPara(perfil: PerfilGlicemia, p: ParametrosGlicemia): Metas | null {
  if (!perfil.temDiabetes) return null;
  const m = perfil.metasGlicemia;
  if (m && m.definidasPor !== 'diretriz') {
    return { origem: m.definidasPor, perfil: 'medico', jejumMin: m.jejumMin, jejumMax: m.jejumMax, posMax: m.posMax, deitarMin: m.deitarMin, deitarMax: m.deitarMax, regraId: null };
  }
  const perfilMeta = perfil.perfilMetaGlicemica ?? 'adulto';
  const t = p.metas[perfilMeta];
  return { origem: 'diretriz', perfil: perfilMeta, jejumMin: t.jejum[0], jejumMax: t.jejum[1], posMax: t.pos, deitarMin: t.deitar[0], deitarMax: t.deitar[1], regraId: t.regra.id };
}

/** Faixa da meta para um momento; null quando o momento não tem meta (1 h pós, aleatória, exercício…). */
export function faixaDaMeta(momento: MomentoGlicemia, metas: Metas): [number, number] | null {
  if (JEJUM.includes(momento) || PRE.includes(momento)) return [metas.jejumMin, metas.jejumMax];
  if (POS2H.includes(momento)) return metas.posMax == null ? null : [0, metas.posMax];
  if (DEITAR.includes(momento)) return [metas.deitarMin, metas.deitarMax];
  return null;
}

const daRegra = (camada: CamadaGlicemia, regra: RegraParametros): AvaliacaoGlicemia =>
  ({ camada, nivel: regra.nivelAlerta, mensagem: regra.mensagemPaciente, foraDaMeta: null, regraId: regra.id });

export function avaliarGlicemia(m: { mgdl: number; momento: MomentoGlicemia; sintomas?: SintomaGlicemia[] }, perfil: PerfilGlicemia, metas: Metas | null, p: ParametrosGlicemia): AvaliacaoGlicemia {
  const s = m.sintomas ?? [];
  // Hierarquia de segurança (§66): emergências → laranja → amarelo → meta/contexto
  if (m.mgdl < 70 && s.some((x) => p.hipoN3.sintomas.includes(x))) return daRegra('hipo_n3', p.hipoN3.regra);
  if (m.mgdl >= p.hiperSintoma.min && s.some((x) => p.hiperSintoma.sintomas.includes(x))) return daRegra('hiper_sintoma', p.hiperSintoma.regra);
  if (m.mgdl <= p.hipoN2.max) return daRegra('hipo_n2', p.hipoN2.regra);
  if (m.mgdl >= p.hiper.min) return daRegra('hiper', p.hiper.regra);
  if (m.mgdl >= p.hipoN1.min && m.mgdl <= p.hipoN1.max) return daRegra('hipo_n1', p.hipoN1.regra);

  if (!perfil.temDiabetes) {
    const sd = p.semDiabetes;
    const jejum = JEJUM.includes(m.momento);
    const convite = jejum ? m.mgdl >= sd.jejumDm : m.mgdl >= sd.casualDm;
    if (convite) return { camada: 'sem_diabetes_convite', nivel: null, mensagem: sd.regra.mensagemPaciente, foraDaMeta: null, regraId: sd.regra.id };
    if (jejum && m.mgdl > sd.jejumNormalMax) return { camada: 'sem_diabetes_contexto', nivel: null, mensagem: sd.regra.mensagemPaciente, foraDaMeta: null, regraId: sd.regra.id };
    return { camada: 'sem_diabetes_normal', nivel: null, mensagem: '', foraDaMeta: null, regraId: null };
  }

  const faixa = metas ? faixaDaMeta(m.momento, metas) : null;
  if (!faixa) return { camada: 'na_meta', nivel: null, mensagem: '', foraDaMeta: null, regraId: metas?.regraId ?? null };
  const fora = m.mgdl < faixa[0] ? 'abaixo' : m.mgdl > faixa[1] ? 'acima' : null;
  const faixaTexto = faixa[0] > 0 ? `${faixa[0]} a ${faixa[1]}` : `até ${faixa[1]}`;
  return {
    camada: fora ? 'fora_da_meta' : 'na_meta',
    nivel: null,
    mensagem: fora ? `Este valor está ${fora} da sua meta para este momento (${faixaTexto}).` : `Dentro da sua meta para este momento (${faixaTexto}).`,
    foraDaMeta: fora,
    regraId: metas?.regraId ?? null,
  };
}

const MODELOS: ModeloPlano[] = [
  { id: 'dm1_sem_sensor', rotulo: 'Diabetes tipo 1 sem sensor', descricao: 'Pelo menos 5 medidas por dia: antes das refeições e antes de dormir; também se suspeitar de hipoglicemia, antes de exercício e antes de dirigir.', momentos: ['antes_cafe', 'antes_almoco', 'antes_jantar', 'antes_dormir'], fonte: 'SBD 2026: Monitorização, R5 (I, B)' },
  { id: 'dm2_basal', rotulo: 'Diabetes tipo 2 com insulina basal', descricao: 'Glicemia em jejum, com medidas noturnas eventuais; também se suspeitar de hipoglicemia.', momentos: ['jejum'], fonte: 'SBD 2026: Monitorização, R9 (I, B)' },
  { id: 'dm2_intensiva', rotulo: 'Diabetes tipo 2 com insulina em várias doses', descricao: 'Pelo menos antes das refeições e ao deitar; também se suspeitar de hipoglicemia e antes de dirigir.', momentos: ['antes_cafe', 'antes_almoco', 'antes_jantar', 'antes_dormir'], fonte: 'SBD 2026: Monitorização, R10 (I, C)' },
  { id: 'dm2_sem_insulina', rotulo: 'Diabetes tipo 2 sem insulina', descricao: 'A medida em casa pode ser considerada, de forma individualizada, para autoconhecimento e adesão. Sem horários fixos: combine com seu médico.', momentos: [], fonte: 'SBD 2026: Monitorização, R8 (IIb, B)' },
];

/** Modelos sugeridos quando o médico não prescreveu horários (§7). Sem tipo/insulina definidos, devolve todos. */
export function modelosPlano(tipoDiabetes: PerfilGlicemia['tipoDiabetes'], usaInsulina: PerfilGlicemia['usaInsulina']): ModeloPlano[] {
  if (tipoDiabetes === 'dm1') return MODELOS.filter((m) => m.id === 'dm1_sem_sensor');
  if (tipoDiabetes === 'dm2' && usaInsulina === 'basal') return MODELOS.filter((m) => m.id === 'dm2_basal');
  if (tipoDiabetes === 'dm2' && usaInsulina === 'intensiva') return MODELOS.filter((m) => m.id === 'dm2_intensiva');
  if (tipoDiabetes === 'dm2' && usaInsulina === 'nao') return MODELOS.filter((m) => m.id === 'dm2_sem_insulina');
  return MODELOS;
}

const mediaDe = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** Resumo do relatório (§8). Contagens de meta só nos momentos que têm meta; episódios < 70 e > 250 independem de meta. */
export function resumoGlicemia(medidas: MedidaGlicemia[], metas: Metas | null): ResumoGlicemia {
  if (!medidas.length) return { n: 0, media: null, mediaJejum: null, mediaPre: null, mediaPos2h: null, menor: null, maior: null, abaixoDaMeta: 0, acimaDaMeta: 0, episodiosBaixos: 0, episodiosAltos: 0 };
  const ord = [...medidas].sort((a, b) => a.mgdl - b.mgdl);
  let abaixo = 0;
  let acima = 0;
  if (metas) {
    for (const m of medidas) {
      const f = faixaDaMeta(m.momento, metas);
      if (!f) continue;
      if (m.mgdl < f[0]) abaixo++;
      else if (m.mgdl > f[1]) acima++;
    }
  }
  return {
    n: medidas.length,
    media: mediaDe(medidas.map((m) => m.mgdl)),
    mediaJejum: mediaDe(medidas.filter((m) => JEJUM.includes(m.momento)).map((m) => m.mgdl)),
    mediaPre: mediaDe(medidas.filter((m) => JEJUM.includes(m.momento) || PRE.includes(m.momento)).map((m) => m.mgdl)),
    mediaPos2h: mediaDe(medidas.filter((m) => POS2H.includes(m.momento)).map((m) => m.mgdl)),
    menor: ord[0],
    maior: ord[ord.length - 1],
    abaixoDaMeta: abaixo,
    acimaDaMeta: acima,
    episodiosBaixos: medidas.filter((m) => m.mgdl < 70).length,
    episodiosAltos: medidas.filter((m) => m.mgdl > 250).length,
  };
}
