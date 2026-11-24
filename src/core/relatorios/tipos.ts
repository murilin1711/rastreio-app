import type { ExameCardio } from '@core/cardio/mapeamento';
import type { SessaoComResultado } from '@core/cardio/mapeamento';
import type { RiscoSalvo } from '@core/cardio/riscoCv';
import type { Documento } from '@core/documentos/tipos';
import type { EstadoDose } from '@core/medicacoes/adesao';
import type { Medicacao, Tomada } from '@core/medicacoes/tipos';
import type { AntecedenteFamiliar, PerfilSaude } from '@core/perfil/tipos';
import type { ExameRegistrado, PendenciaAberta, SintomaAberto } from '@core/rastreando/contexto';
import type { MedidaPA, ParametrosPressao } from '@core/regras/cardio/tipos';
import type { MedidaGlicemia, Metas } from '@core/regras/cardio/tiposGlicemia';
import type { ItemCheckup } from '@core/regras/cardio/tiposRisco';
import type { Atividade, Checkin, MedidaCorporal, Meta, ParametrosBemEstar, Refeicao, RegistroAgua, Sono } from '@core/regras/bemestar/tipos';
import type { Vinculo } from '@core/regras/bemestar/vinculos';
import type { Programa, ResultadoElegibilidade } from '@core/regras/tipos';

/** Especialidades de "Preparar minha consulta" (D-009) — mesmo domínio da tabela `consultas`. */
export type Especialidade = 'cardiologia' | 'endocrinologia' | 'clinica_medica' | 'ginecologia' | 'mastologia' | 'urologia' | 'gastro_coloprocto' | 'pneumologia' | 'oncologia' | 'outra';

export type TipoRelatorio = 'cardio' | 'oncologico' | 'geral' | 'consulta' | 'bemestar';

/** Período das medidas (PA, glicemia, MRPA, documentos). Exames e rastreamentos não têm limite (D-009). */
export interface Periodo { desde: string; ate: string; rotulo: string }

export interface ConsultaResumo { id: string; especialidade: Especialidade; dataHora: string; local: string | null; profissional: string | null }

/** Tudo que um relatório pode usar. Montado por `carregar.ts`; os `montar*` são puros sobre este objeto. */
export interface DadosNero {
  /** ISO do momento da carga; as janelas de adesão (2 e 4 semanas) contam para trás a partir do dia local dele. */
  geradoEm: string;
  perfil: PerfilSaude;
  antecedentes: AntecedenteFamiliar[];
  /** Ativas e históricas; a montagem separa. */
  medicacoes: Medicacao[];
  /** Tomadas das 4 semanas até o dia local de geração (previstas e "se precisar"). */
  tomadas: Tomada[];
  /** Parâmetros de pressão (referência domiciliar, C-010); null se as regras não vierem. */
  parametrosPressao: ParametrosPressao | null;
  /** Medidas casuais do período (fora de sessão MRPA). */
  medidasPA: MedidaPA[];
  /** Sessões concluídas do período, com resultado. */
  sessoesMrpa: SessaoComResultado[];
  glicemias: MedidaGlicemia[];
  metasGlicemia: Metas | null;
  /** Todos os exames do módulo cardio (a montagem escolhe o último por tipo + histórico). */
  examesCardio: ExameCardio[];
  examesRastreamento: ExameRegistrado[];
  pendencias: PendenciaAberta[];
  sintomas: SintomaAberto[];
  avaliacoes: Partial<Record<Programa, ResultadoElegibilidade>>;
  /** Último primeiro. */
  riscos: RiscoSalvo[];
  checkup: { itens: ItemCheckup[]; atualizados: number; total: number } | null;
  /** Último peso registrado em `medidas` (tipo 'peso'). */
  peso: { kg: number; data: string } | null;
  documentos: Documento[];
  consultas: ConsultaResumo[];
  /** Fase 4 — Saúde & Bem-estar (§88). Medidas, atividades, sonos, refeições e check-ins do período; metas ativas; vínculos das glicemias. */
  bemEstar?: { corporais: MedidaCorporal[]; aguas: RegistroAgua[]; atividades: Atividade[]; sonos: Sono[]; refeicoes: Refeicao[]; checkins: Checkin[]; metas: Meta[]; vinculos: Vinculo[]; parametros: ParametrosBemEstar; alturaCm: number | null; sexo: 'feminino' | 'masculino' | null; idade: number | null };
}

export type Bloco =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'lista'; itens: string[] }
  | { tipo: 'tabela'; colunas: string[]; linhas: string[][] }
  | { tipo: 'barras'; itens: { rotulo: string; valor: number; max: number; texto: string }[] }
  | { tipo: 'chip'; nivel: 'verde' | 'amarelo' | 'laranja' | 'vermelho' | 'cinza'; texto: string };

export type ChaveSecao =
  | 'perfil' | 'medicamentos' | 'documentos'
  | 'pa' | 'mrpa' | 'glicemia' | 'hba1c' | 'lipidios' | 'renal' | 'tsh' | 'peso' | 'exames_cardio' | 'prevent' | 'agravantes' | 'checkup'
  | 'rastreamentos_status' | 'mama' | 'colo' | 'colorretal' | 'pulmao' | 'prostata'
  | 'pendencias' | 'sintomas' | 'hist_familiar' | 'tabagismo' | 'consultas'
  | 'corpo' | 'alimentacao' | 'agua' | 'atividade' | 'sono' | 'checkins';

export interface SecaoRelatorio {
  chave: ChaveSecao;
  titulo: string;
  blocos: Bloco[];
  /** Primeira seção da parte "Outras informações do meu histórico" (D-025); quem renderiza põe o divisor. */
  abreComplemento?: boolean;
}

/** Título da terceira parte do relatório por especialidade (D-025). */
export const TITULO_COMPLEMENTO = 'Outras informações do meu histórico';

export const SEM_REGISTROS = 'Sem registros no período';

// ---- Painel (página 1 do relatório novo, D-067). Sem selos de cor (Ruling S0). ----

export type TipoCartao = 'pressao' | 'hba1c' | 'ldl' | 'risco' | 'glicemia' | 'peso' | 'cintura';

export interface CartaoNumero { tipo: TipoCartao; titulo: string; valor: string; unidade: string; data: string | null; detalhe: string | null; tendencia: 'subiu' | 'desceu' | null }

export interface CabecalhoPainel { nome: string; idade: number | null; sexo: string | null; condicoes: string[]; tabagismo: string }

/** Estados de dose desenhados no painel: o que ainda pode ser marcado não entra. */
export type EstadoDosePainel = Exclude<EstadoDose, 'pendente'>;

export interface LinhaAdesao { medicacaoId: string; nome: string; dose: string | null; sePrecisar: boolean; doses: EstadoDosePainel[]; tomou: number; previstas: number; errado: number; percentual: number | null; usosSePrecisar: number }

export interface ProgramaPainel { programa: Programa; rotulo: string; situacao: string; proximaData: string | null; mensagem: string }

export interface PontoPressao { data: string; pas: number }

/**
 * `null` em `seriePressao`/`adesao`/`prevencao` = bloco não desenhado. `referenciaSistolica` = linha do gráfico:
 * PAS da referência domiciliar dos parâmetros de pressão, ou 130 quando eles não vierem (R3-T1-a).
 */
export interface PainelRelatorio { cabecalho: CabecalhoPainel; atencao: string[]; cartoes: CartaoNumero[]; seriePressao: PontoPressao[] | null; referenciaSistolica: number; adesao: LinhaAdesao[] | null; prevencao: ProgramaPainel[] | null; prevencaoDetalhada: boolean }
