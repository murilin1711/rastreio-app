import type { DoseClassificada } from '@core/medicacoes/adesao';
import type { Medicacao } from '@core/medicacoes/tipos';
import { deveExplicarMarcacao, FRASE_MARCAR, rotuloEstadoDose } from '../rotulos';

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

describe('deveExplicarMarcacao', () => {
  const base: Medicacao = {
    id: 'm1', nome: 'Losartana', dose: '50 mg', horarios: [{ hora: '08:00', quantidade: 1 }], unidade: 'comprimido',
    doseVariavel: false, sePrecisar: false, horariosDesde: null, desde: null, ate: null, prescritor: null, ativa: true,
    lembrar: true, observacao: null,
  };
  const comHorario: Medicacao = { ...base, ativa: false };
  const sePrecisarSemHorario: Medicacao = { ...base, id: 'm2', horarios: [], sePrecisar: true };

  it('explica só no primeiro remédio com horário', () => {
    expect(deveExplicarMarcacao([], true)).toBe(true); // primeiro remédio com horário
    expect(deveExplicarMarcacao([comHorario], true)).toBe(false); // já havia um com horário (mesmo interrompido)
    expect(deveExplicarMarcacao([sePrecisarSemHorario], true)).toBe(true);
    expect(deveExplicarMarcacao([], false)).toBe(false); // "se precisar" não explica
  });

  it('frase fixa da marcação', () => {
    expect(FRASE_MARCAR).toBe('Sempre que tomar, marque no NERO. É assim que você e seu médico acompanham o tratamento.');
  });
});
