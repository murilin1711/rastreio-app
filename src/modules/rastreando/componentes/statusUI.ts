import type { StatusRastreamento } from '@core/regras/tipos';
import type { NivelAlertaUI } from '@ui/theme';

/** Rótulo e nível visual de cada status do §28. */
export const STATUS_UI: Record<StatusRastreamento, { rotulo: string; nivel: NivelAlertaUI }> = {
  em_dia: { rotulo: 'Em dia', nivel: 'verde' },
  indicado: { rotulo: 'Indicado', nivel: 'verde' },
  exame_proximo: { rotulo: 'Exame próximo', nivel: 'amarelo' },
  exame_atrasado: { rotulo: 'Exame atrasado', nivel: 'laranja' },
  proximo_de_iniciar: { rotulo: 'Em breve', nivel: 'cinza' },
  nao_indicado_no_momento: { rotulo: 'Não indicado agora', nivel: 'cinza' },
  avaliacao_individualizada: { rotulo: 'Avaliação individualizada', nivel: 'amarelo' },
  acompanhamento_medico: { rotulo: 'Acompanhamento médico', nivel: 'amarelo' },
};

export const NIVEL_PENDENCIA: Record<string, NivelAlertaUI> = { verde: 'verde', amarelo: 'amarelo', laranja: 'laranja', vermelho: 'vermelho', cinza: 'cinza' };

export function dataBr(iso: string | null | undefined): string {
  if (!iso) return '';
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}
