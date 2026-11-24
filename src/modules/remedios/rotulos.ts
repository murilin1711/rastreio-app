import type { DoseClassificada, EstadoDose, ResumoAdesao } from '@core/medicacoes/adesao';
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

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Resumo de um remédio no período (check-in semanal, spec §6.6), só com fatos: "12 de 14 · 1 não tomada ·
 * 1 sem registro"; "7 de 7 ✓" quando tomou todas; "usou 3 vezes" para "se precisar".
 */
export function textoResumoAdesao(r: ResumoAdesao): string {
  if (r.sePrecisar) return `usou ${plural(r.usosSePrecisar, 'vez', 'vezes')}`;
  const base = `${r.tomou} de ${r.previstas}`;
  if (r.previstas > 0 && r.tomou === r.previstas) return `${base} ✓`;
  const partes = [base];
  if (r.naoTomou > 0) partes.push(plural(r.naoTomou, 'não tomada', 'não tomadas'));
  if (r.errado > 0) partes.push(plural(r.errado, 'errada', 'erradas'));
  if (r.semRegistro > 0) partes.push(`${r.semRegistro} sem registro`);
  if (r.comAtraso > 0) partes.push(`${r.comAtraso} com atraso`);
  return partes.join(' · ');
}

const SIMBOLO: Record<EstadoDose, '●' | '○' | '–' | '⚠' | null> = {
  tomou: '●',
  nao_tomou: '○',
  sem_registro: '–',
  errado: '⚠',
  pendente: null,
};

/** Símbolo da dose na fileira do resumo; a pendente (ainda pode ser marcada) fica de fora. */
export function simboloDose(estado: EstadoDose): '●' | '○' | '–' | '⚠' | null {
  return SIMBOLO[estado];
}
