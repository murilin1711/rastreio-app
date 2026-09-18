import type { RegraParametros } from '../tipos';

export type Sexo = 'feminino' | 'masculino';
export type ObjetivoPeso = 'reducao' | 'manutencao' | 'aumento' | 'sem_meta';

/** Linha de `medidas` com tipo corporal (D-011). `valores` segue o comentário da coluna. */
export interface MedidaCorporal {
  id: string;
  medidoEm: string;
  tipo: 'peso' | 'cintura' | 'quadril' | 'composicao';
  valores: { kg?: number; cm?: number; metodo?: string; gordura_pct?: number; massa_gordura_kg?: number; massa_magra_kg?: number; massa_muscular_kg?: number; agua_pct?: number; gordura_visceral?: number; tmb_kcal?: number };
}

export type TipoAtividade = 'caminhada' | 'corrida' | 'ciclismo' | 'musculacao' | 'natacao' | 'esporte_coletivo' | 'danca' | 'funcional' | 'pilates' | 'yoga' | 'outra';
export type Intensidade = 'leve' | 'moderada' | 'vigorosa';
export interface Atividade { id: string; inicio: string; tipo: TipoAtividade; duracaoMin: number; intensidade: Intensidade; distanciaKm: number | null; fcMedia: number | null; calorias: number | null; observacao: string | null }

export interface Sono { id: string; dormiuEm: string; acordouEm: string; minutos: number; qualidade: 1 | 2 | 3 | 4 | 5 | null; contexto: { acordouNoite?: boolean; cochilou?: boolean; dificuldadeAdormecer?: boolean; acordouDescansado?: boolean } }

export type TipoMeta = 'peso' | 'cintura' | 'atividade_min' | 'atividade_dias' | 'fortalecimento_dias' | 'sono_min' | 'pressao';
export interface Meta { id: string; tipo: TipoMeta; valor: number; origem: 'app' | 'usuario' | 'profissional'; detalhe: string | null; ativa: boolean }

/** Parâmetros lidos de `regras_clinicas` (programa bem_estar), uma camada por regra. */
export interface ParametrosBemEstar {
  imc: { baixo: number; sobrepeso: number; obesidade1: number; obesidade2: number; obesidade3: number; regra: RegraParametros };
  imcIdoso: { idadeMin: number; baixo: number; alto: number; regra: RegraParametros };
  cintura: { hAumentado: number; mAumentado: number; hMuito: number; mMuito: number; regra: RegraParametros };
  rca: { limite: number; regra: RegraParametros };
  rcq: { h: number; m: number; regra: RegraParametros };
  tecnica: { regra: RegraParametros };
  atividade: { moderadaMin: number; moderadaMax: number; vigorosaMin: number; vigorosaMax: number; fatorVigorosa: number; fortalecimentoDias: number; idosoIdade: number; equilibrioDias: number; regra: RegraParametros };
  sono: { minimoMin: number; maximoIncertoMin: number; regra: RegraParametros };
  tendencia: { minimoMedidas: number; janelaDias: number; limiarPct: number; regra: RegraParametros };
  pmav: { imcMin: number; imc2: number; imcMax: number; reduzida1: number; controlada1: number; reduzida2: number; controlada2: number; regra: RegraParametros };
  perdaNaoIntencional: { pct: number; meses: number; regra: RegraParametros };
  vinculo: { horas: number; regra: RegraParametros };
}
