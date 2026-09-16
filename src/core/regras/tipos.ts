/**
 * Motor de regras clínicas do NERO (§31, §42, §43, §53, §65, §66).
 * TypeScript puro: este pacote NÃO importa React, Expo, Supabase nem UI.
 */

export type Programa = 'mama' | 'colo_utero' | 'colorretal' | 'pulmao' | 'prostata';
export type NivelAlerta = 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'cinza';
export type Classificacao = 'normal' | 'controle' | 'complementar' | 'investigacao' | 'especializado' | 'pendente';

/** Os oito status de "Seus rastreamentos" (§28). */
export type StatusRastreamento =
  | 'indicado'
  | 'proximo_de_iniciar'
  | 'nao_indicado_no_momento'
  | 'avaliacao_individualizada'
  | 'acompanhamento_medico'
  | 'em_dia'
  | 'exame_proximo'
  | 'exame_atrasado';

/** Subconjunto do perfil já com derivados calculados (idade, maços-ano…). */
export interface PerfilRegras {
  idade: number;
  sexoNascimento: 'feminino' | 'masculino';
  possuiColoUtero: boolean | null;
  jaTeveAtividadeSexual: boolean | null;
  histerectomia: boolean | null;
  racaCor: 'branca' | 'preta' | 'parda' | 'amarela' | 'indigena' | 'nao_informar' | null;
  imc: number | null;
  tabagismo: { status: 'nunca' | 'ex' | 'atual'; macosAno: number | null; anosDesdeCessacao: number | null };
  condicoes: { diabetes?: boolean; dii?: boolean; imunossupressao?: boolean; hiv?: boolean; doencaRenal?: boolean };
  historicoCancerPessoal: string[];
  lesoesPrecursoras: string[];
  doencasGeneticas: string[];
  radioterapiaToracica: boolean;
  antecedentes: { condicao: string; grau: string; idadeDiagnostico: number | null }[];
}

export interface ExameEntrada {
  tipo: string;
  programa: Programa;
  dataRealizacao: string; // 'AAAA-MM-DD'
  resultado: Record<string, unknown>; // estruturado: {birads: 3}, {hpv: '16'}, {fit: 'positivo'}…
}

export interface ContextoAvaliacao {
  sintomasAlarme: string[];
  pendenciasAbertas: { programa: Programa; exameOrigemId: string }[];
  emAcompanhamentoEspecializado: Programa[];
  historicoExames: (ExameEntrada & { id: string; classificacao: Classificacao })[];
  /** Data da última colonoscopia completa e de qualidade — CONITEC: 10 anos sem FIT. */
  colonoscopiaAdequadaEm: string | null;
}

/** Uma linha de `regras_clinicas` (§65). */
export interface RegraParametros {
  id: string;
  versao: string;
  fonte: string;
  ano: number;
  condicao: Record<string, unknown>;
  classificacao: Classificacao;
  nivelAlerta: NivelAlerta;
  proximaAcao: string;
  intervaloMeses: number | null;
  mensagemPaciente: string;
}

/** Campos internos de todo exame após classificação (§53). */
export interface ResultadoClassificacao {
  classificacao: Classificacao;
  nivelAlerta: NivelAlerta;
  proximaAcao: string;
  dataProximaAcao: string | null;
  abrePendencia: boolean;
  mensagemPaciente: string;
  regraId: string | null;
  regraVersao: string | null;
  motivoSeguranca?: 'sintoma_alarme' | 'pendencia_aberta' | 'acompanhamento_especializado';
}

export interface ResultadoElegibilidade {
  programa: Programa;
  status: StatusRastreamento;
  mensagem: string;
  regraId: string | null;
  regraVersao: string | null;
  proximaData: string | null;
  /** Regra citada (ex.: "ACG 2021, Rec. 9"). */
  detalhes?: string;
}

export interface BloqueioSeguranca {
  motivo: 'sintoma_alarme' | 'pendencia_aberta' | 'acompanhamento_especializado';
  nivelAlerta: NivelAlerta;
  mensagemPaciente: string;
}

/** Ponto de extensão por programa — a Fase 1 implementa mama, colo_utero, colorretal, pulmao, prostata. */
export interface ProgramaHandler {
  /** Aplicável anatomicamente / por sexo a este perfil? */
  aplicavel(perfil: PerfilRegras): boolean;
  /** Fatores que exigem avaliação individualizada (§29.3); devolve a mensagem ou null. */
  fatoresModificadores(perfil: PerfilRegras): string | null;
  /** Seleciona a regra que casa com o resultado do exame, ou null. */
  selecionarRegra(exame: ExameEntrada, regras: RegraParametros[], perfil: PerfilRegras, contexto: ContextoAvaliacao): RegraParametros | null;
  /**
   * Faixa etária de rastreamento para este perfil. `max: null` = sem limite superior.
   * Devolver `null` quando o perfil não atende aos critérios de entrada (ex.: pulmão sem carga tabágica).
   * Se ausente, a faixa vem da regra de elegibilidade (`condicao.idade_min/idade_max`).
   */
  faixaEtaria?(perfil: PerfilRegras): { min: number; max: number | null } | null;
  /** Mensagem quando `faixaEtaria` devolve null (explica os critérios ao paciente). */
  mensagemNaoElegivel?(perfil: PerfilRegras): string;
}
export type ProgramaHandlers = Partial<Record<Programa, ProgramaHandler>>;
