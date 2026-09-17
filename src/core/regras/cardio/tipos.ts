/**
 * Domínio do módulo Coração & Metabolismo (§1–§4). TypeScript puro.
 * Referências: DBHA 2025 · Diretrizes de Medidas da PA 2023 (C-010, C-011).
 * Funcionamento: docs/nero/funcionamento/coracao-metabolismo.md
 */
import type { NivelAlerta, RegraParametros } from '../tipos';

export type SintomaPA = 'dor_toracica' | 'dispneia_importante' | 'deficit_neurologico' | 'alteracao_visual' | 'confusao' | 'sincope';
export type MotivoExclusao = 'pad_maior_140' | 'pad_menor_40' | 'pas_menor_70' | 'pas_maior_250' | 'pas_menor_pad' | 'pp_menor_20' | 'pp_maior_100';
export type PeriodoMrpa = 'manha' | 'noite';

export interface MedidaPA {
  id: string;
  medidoEm: string; // ISO completo
  pas: number;
  pad: number;
  fc: number | null;
  sessaoId: string | null;
  contexto: {
    braco?: 'esquerdo' | 'direito';
    posicao?: 'sentado' | 'deitado' | 'em_pe';
    momentoMedicacao?: 'antes' | 'depois' | 'nao_uso';
    sintomas?: SintomaPA[];
    implausivelConfirmada?: boolean;
    periodo?: PeriodoMrpa;
    ordem?: 1 | 2 | 3;
    excluida?: boolean;
    motivoExclusao?: MotivoExclusao;
  };
}

export type CamadaPA = 'contexto' | 'muito_elevado' | 'muito_elevado_sintoma';

export interface AvaliacaoPA {
  camada: CamadaPA;
  /** null = sem cor (medida casual é triagem — DBHA 2025 §3.7.1). */
  nivel: NivelAlerta | null;
  mensagem: string;
  acimaReferenciaDomiciliar: boolean;
  regraId: string | null;
}

export interface SessaoMrpa {
  id: string;
  inicio: string; // 'AAAA-MM-DD'
  diasPrevistos: 4 | 5 | 6;
  status: 'em_andamento' | 'concluida' | 'cancelada';
  horarios: { manha: string; noite: string };
  paConsultorio: { pas: number; pad: number; medidoEm: string } | null;
}

export interface MediaPA { pas: number; pad: number; n: number }

export interface RelatorioMrpa {
  medidasValidas: number;
  medidasExcluidas: number;
  diasComRegistro: number;
  medias: {
    total: MediaPA | null;
    manha: MediaPA | null;
    noite: MediaPA | null;
    porDia: { dia: number; data: string; manha: MediaPA | null; noite: MediaPA | null; total: MediaPA | null }[];
  };
  valido: boolean;
  motivoInvalidez: 'poucas_medidas' | 'dia_sem_periodo' | 'sem_medidas' | null;
  /** null quando inválido. */
  acimaReferencia: boolean | null;
  diferencaConsultorio: { pas: number; pad: number } | null;
  regraId: string | null;
}

/** Parâmetros lidos de `regras_clinicas` (programa 'pressao'), por camada. */
export interface ParametrosPressao {
  implausivel: { padMax: number; padMin: number; pasMin: number; pasMax: number; ppMin: number; ppMax: number; regra: RegraParametros };
  referenciaDomiciliar: { pas: number; pad: number; regra: RegraParametros };
  conviteMrpa: { minimoMedidas: number; janelaDias: number; repetirDias: number; pas: number; pad: number; regra: RegraParametros };
  muitoElevado: { pas: number; pad: number; regra: RegraParametros };
  muitoElevadoSintoma: { pas: number; pad: number; sintomas: SintomaPA[]; regra: RegraParametros };
  mrpaAcima: { pas: number; pad: number; regra: RegraParametros };
  validade: { minimos: Record<string, number>; medidasPorPeriodo: number; intervaloMin: number; diasMin: number; diasMax: number; diasPadrao: number; regra: RegraParametros };
}
