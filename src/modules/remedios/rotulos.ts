import type { DoseClassificada, EstadoDose } from '@core/medicacoes/adesao';
import type { Medicacao } from '@core/medicacoes/tipos';

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

/** Explicação da marcação (spec §6.1): fixa no topo de "Meus remédios" e mostrada uma vez ao salvar. */
export const FRASE_MARCAR = 'Sempre que tomar, marque no NERO. É assim que você e seu médico acompanham o tratamento.';

/**
 * A explicação aparece uma vez só: ao salvar o primeiro remédio com horário. `antes` é a lista anterior
 * ao salvamento (ativos e interrompidos); "se precisar" não tem dose a marcar e não conta.
 */
export function deveExplicarMarcacao(antes: Medicacao[], salvoTemHorario: boolean): boolean {
  return salvoTemHorario && !antes.some((m) => m.horarios.length > 0);
}
