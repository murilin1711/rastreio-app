/**
 * Glicemia (§5–§8, C-012). TypeScript puro. Fonte: Diretriz da SBD ed. 2026.
 * `MomentoGlicemia` é duplicado de `@core/perfil/tipos` para manter este pacote sem dependências.
 */
import type { NivelAlerta, RegraParametros } from '../tipos';

export type MomentoGlicemia = 'jejum' | 'antes_cafe' | 'pos_cafe_1h' | 'pos_cafe_2h' | 'antes_almoco' | 'pos_almoco_1h' | 'pos_almoco_2h' | 'antes_jantar' | 'pos_jantar_1h' | 'pos_jantar_2h' | 'antes_dormir' | 'madrugada' | 'antes_exercicio' | 'depois_exercicio' | 'sintomas_hipoglicemia' | 'aleatoria' | 'outro';
export type SintomaGlicemia = 'tremor' | 'sudorese' | 'tontura' | 'fraqueza' | 'confusao' | 'sede_intensa' | 'nausea' | 'vomito' | 'dor_abdominal' | 'respiracao_rapida' | 'sonolencia' | 'precisou_de_ajuda' | 'nenhum' | 'outro';
export type PerfilMeta = 'adulto' | 'idoso_comprometido' | 'idoso_muito_comprometido';

export interface MedidaGlicemia {
  id: string;
  medidoEm: string;
  mgdl: number;
  momento: MomentoGlicemia;
  contexto: {
    refeicao?: 'nao_registrar' | 'pequena' | 'habitual' | 'maior';
    medicamento?: { nome?: string; dose?: string; horario?: string };
    atividadeFisica?: boolean;
    sintomas?: SintomaGlicemia[];
  };
}

export interface Metas {
  origem: 'medico' | 'outro_profissional' | 'diretriz';
  perfil: PerfilMeta | 'medico';
  jejumMin: number;
  jejumMax: number;
  posMax: number | null;
  deitarMin: number;
  deitarMax: number;
  regraId: string | null;
}

export type CamadaGlicemia = 'hipo_n3' | 'hiper_sintoma' | 'hipo_n2' | 'hiper' | 'hipo_n1' | 'fora_da_meta' | 'na_meta' | 'sem_diabetes_convite' | 'sem_diabetes_contexto' | 'sem_diabetes_normal';

export interface AvaliacaoGlicemia {
  camada: CamadaGlicemia;
  /** null = sem cor (fora da meta é educativo — §16; sem diabetes é contexto/convite). */
  nivel: NivelAlerta | null;
  mensagem: string;
  foraDaMeta: 'acima' | 'abaixo' | null;
  regraId: string | null;
}

export type ModeloPlanoId = 'dm1_sem_sensor' | 'dm2_basal' | 'dm2_intensiva' | 'dm2_sem_insulina';
export interface ModeloPlano { id: ModeloPlanoId; rotulo: string; descricao: string; momentos: MomentoGlicemia[]; fonte: string }

export interface ResumoGlicemia {
  n: number;
  media: number | null;
  mediaJejum: number | null;
  mediaPre: number | null;
  mediaPos2h: number | null;
  menor: MedidaGlicemia | null;
  maior: MedidaGlicemia | null;
  abaixoDaMeta: number;
  acimaDaMeta: number;
  episodiosBaixos: number;
  episodiosAltos: number;
}

export interface PerfilGlicemia {
  temDiabetes: boolean | null;
  tipoDiabetes: 'dm1' | 'dm2' | 'gestacional' | 'outro' | null;
  usaInsulina: 'nao' | 'basal' | 'intensiva' | null;
  perfilMetaGlicemica: PerfilMeta | null;
  metasGlicemia: { definidasPor: 'medico' | 'outro_profissional' | 'diretriz'; jejumMin: number; jejumMax: number; posMax: number | null; deitarMin: number; deitarMax: number } | null;
}

export interface ParametrosGlicemia {
  metas: Record<PerfilMeta, { jejum: [number, number]; pos: number | null; deitar: [number, number]; regra: RegraParametros }>;
  hipoN1: { min: number; max: number; regra: RegraParametros };
  hipoN2: { max: number; regra: RegraParametros };
  hipoN3: { sintomas: SintomaGlicemia[]; regra: RegraParametros };
  hiper: { min: number; regra: RegraParametros };
  hiperSintoma: { min: number; sintomas: SintomaGlicemia[]; regra: RegraParametros };
  semDiabetes: { jejumNormalMax: number; jejumPreMax: number; jejumDm: number; casualDm: number; regra: RegraParametros };
}
