import type { ExameCardio } from '@core/cardio/mapeamento';
import type { SessaoComResultado } from '@core/cardio/mapeamento';
import type { RiscoSalvo } from '@core/cardio/riscoCv';
import type { Documento } from '@core/documentos/tipos';
import type { Medicacao } from '@core/medicacoes/tipos';
import type { AntecedenteFamiliar, PerfilSaude } from '@core/perfil/tipos';
import type { ExameRegistrado, PendenciaAberta, SintomaAberto } from '@core/rastreando/contexto';
import type { MedidaPA } from '@core/regras/cardio/tipos';
import type { MedidaGlicemia, Metas } from '@core/regras/cardio/tiposGlicemia';
import type { ItemCheckup } from '@core/regras/cardio/tiposRisco';
import type { Programa, ResultadoElegibilidade } from '@core/regras/tipos';

/** Especialidades de "Preparar minha consulta" (D-009) — mesmo domínio da tabela `consultas`. */
export type Especialidade = 'cardiologia' | 'endocrinologia' | 'clinica_medica' | 'ginecologia' | 'mastologia' | 'urologia' | 'gastro_coloprocto' | 'pneumologia' | 'oncologia' | 'outra';

export type TipoRelatorio = 'cardio' | 'oncologico' | 'geral' | 'consulta';

/** Período das medidas (PA, glicemia, MRPA, documentos). Exames e rastreamentos não têm limite (D-009). */
export interface Periodo { desde: string; ate: string; rotulo: string }

export interface ConsultaResumo { id: string; especialidade: Especialidade; dataHora: string; local: string | null; profissional: string | null }

/** Tudo que um relatório pode usar. Montado por `carregar.ts`; os `montar*` são puros sobre este objeto. */
export interface DadosNero {
  perfil: PerfilSaude;
  antecedentes: AntecedenteFamiliar[];
  /** Ativas e históricas; a montagem separa. */
  medicacoes: Medicacao[];
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
  | 'pendencias' | 'sintomas' | 'hist_familiar' | 'tabagismo' | 'consultas';

export interface SecaoRelatorio { chave: ChaveSecao; titulo: string; blocos: Bloco[] }

export const SEM_REGISTROS = 'Sem registros no período';
