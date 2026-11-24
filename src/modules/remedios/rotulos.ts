import type { DoseClassificada, EstadoDose } from '@core/medicacoes/adesao';

const ROTULO: Record<EstadoDose, string> = {
  tomou: '✓ Tomou',
  nao_tomou: '✗ Não tomou',
  errado: '⚠ Dose diferente',
  sem_registro: '— Sem registro',
  pendente: 'Marcar',
};

/** Rótulo curto do estado de uma dose (spec §6.5). "Com atraso" só se soma ao "Tomou". */
export function rotuloEstadoDose(d: DoseClassificada): string {
  if (d.estado === 'tomou' && d.comAtraso) return '✓ Tomou, com atraso';
  return ROTULO[d.estado];
}
