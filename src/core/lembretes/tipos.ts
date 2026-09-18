import type { Especialidade } from '@core/relatorios/tipos';

/** Consulta marcada pelo usuário (D-010). */
export interface Consulta {
  id: string;
  especialidade: Especialidade;
  dataHora: string; // ISO completo
  local: string | null;
  profissional: string | null;
  observacao: string | null;
}
