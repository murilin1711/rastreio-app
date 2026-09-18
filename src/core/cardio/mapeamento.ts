/** Mapeamento banco ↔ domínio do módulo cardio. Funções puras (sem Supabase), testáveis. */
import type { MedidaPA, RelatorioMrpa, SessaoMrpa } from '@core/regras/cardio/tipos';
import type { MedidaGlicemia } from '@core/regras/cardio/tiposGlicemia';

export type LinhaMedida = { id: string; medido_em: string; valores: unknown; contexto: unknown; sessao_id: string | null };
export type LinhaSessao = { id: string; inicio: string; dias_previstos: number; status: string; horarios: unknown; pa_consultorio: unknown; resultado: unknown; concluida_em: string | null };
export type SessaoComResultado = SessaoMrpa & { resultado: RelatorioMrpa | null; concluidaEm: string | null };

const SNAKE_PARA_CAMEL: Record<string, string> = { motivo_exclusao: 'motivoExclusao', momento_medicacao: 'momentoMedicacao', implausivel_confirmada: 'implausivelConfirmada' };
const CAMEL_PARA_SNAKE: Record<string, string> = { motivoExclusao: 'motivo_exclusao', momentoMedicacao: 'momento_medicacao', implausivelConfirmada: 'implausivel_confirmada' };
const renomear = (o: Record<string, unknown>, mapa: Record<string, string>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [mapa[k] ?? k, v]));

export function linhaParaMedidaPA(l: LinhaMedida): MedidaPA {
  const v = (l.valores ?? {}) as { pas: number; pad: number; fc?: number | null };
  const contexto = renomear((l.contexto ?? {}) as Record<string, unknown>, SNAKE_PARA_CAMEL) as MedidaPA['contexto'];
  return { id: l.id, medidoEm: l.medido_em, pas: v.pas, pad: v.pad, fc: v.fc ?? null, sessaoId: l.sessao_id, contexto };
}

export function contextoParaBanco(c: MedidaPA['contexto']): Record<string, unknown> {
  return renomear(c as Record<string, unknown>, CAMEL_PARA_SNAKE);
}

export function linhaParaSessao(l: LinhaSessao): SessaoComResultado {
  const pc = l.pa_consultorio as { pas: number; pad: number; medido_em: string } | null;
  return {
    id: l.id,
    inicio: l.inicio,
    diasPrevistos: l.dias_previstos as 4 | 5 | 6,
    status: l.status as SessaoMrpa['status'],
    horarios: (l.horarios as SessaoMrpa['horarios'] | null) ?? { manha: '08:00', noite: '20:00' },
    paConsultorio: pc ? { pas: pc.pas, pad: pc.pad, medidoEm: pc.medido_em } : null,
    resultado: (l.resultado as RelatorioMrpa | null) ?? null,
    concluidaEm: l.concluida_em,
  };
}

const SNAKE_GLI: Record<string, string> = { atividade_fisica: 'atividadeFisica' };
const CAMEL_GLI: Record<string, string> = { atividadeFisica: 'atividade_fisica' };

export function linhaParaGlicemia(l: LinhaMedida): MedidaGlicemia {
  const v = (l.valores ?? {}) as { mgdl: number };
  const c = renomear((l.contexto ?? {}) as Record<string, unknown>, SNAKE_GLI);
  const { momento, ...contexto } = c as { momento?: MedidaGlicemia['momento'] } & MedidaGlicemia['contexto'];
  return { id: l.id, medidoEm: l.medido_em, mgdl: v.mgdl, momento: momento ?? 'outro', contexto };
}

export function contextoGlicemiaParaBanco(momento: MedidaGlicemia['momento'], c: MedidaGlicemia['contexto']): Record<string, unknown> {
  return { momento, ...renomear(c as Record<string, unknown>, CAMEL_GLI) };
}

export type LinhaExame = { id: string; tipo: string; categoria: string; data_realizacao: string; resultado: unknown; instituicao: string | null; solicitante: string | null; observacoes: string | null; laudo_texto: string | null };
export interface ExameCardio {
  id: string;
  tipo: string;
  categoria: 'laboratorial' | 'cardiologico';
  dataRealizacao: string;
  resultado: { valor?: number; unidade?: string; referenciaMin?: number; referenciaMax?: number; conclusao?: string; agatston?: number; percentil?: number };
  instituicao: string | null;
  solicitante: string | null;
  observacoes: string | null;
}
export function linhaParaExame(l: LinhaExame): ExameCardio {
  return { id: l.id, tipo: l.tipo, categoria: l.categoria as ExameCardio['categoria'], dataRealizacao: l.data_realizacao, resultado: (l.resultado ?? {}) as ExameCardio['resultado'], instituicao: l.instituicao, solicitante: l.solicitante, observacoes: l.observacoes };
}
