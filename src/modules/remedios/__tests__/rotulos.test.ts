import type { DoseClassificada } from '@core/medicacoes/adesao';
import { rotuloEstadoDose } from '../rotulos';

const d: DoseClassificada = {
  medicacaoId: 'm1', data: '2026-11-23', hora: '08:00', quantidadePrevista: 1, estado: 'pendente', comAtraso: false, tomadas: [],
};

it('rótulo de cada estado da dose', () => {
  expect(rotuloEstadoDose({ ...d, estado: 'tomou', comAtraso: false })).toBe('✓ Tomou');
  expect(rotuloEstadoDose({ ...d, estado: 'tomou', comAtraso: true })).toBe('✓ Tomou, com atraso');
  expect(rotuloEstadoDose({ ...d, estado: 'nao_tomou' })).toBe('✗ Não tomou');
  expect(rotuloEstadoDose({ ...d, estado: 'errado' })).toBe('⚠ Dose diferente');
  expect(rotuloEstadoDose({ ...d, estado: 'sem_registro' })).toBe('— Sem registro');
  expect(rotuloEstadoDose({ ...d, estado: 'pendente' })).toBe('Marcar');
});
