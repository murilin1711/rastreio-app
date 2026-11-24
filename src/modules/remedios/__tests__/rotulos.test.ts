import type { DoseClassificada, EstadoDose, ResumoAdesao } from '@core/medicacoes/adesao';
import type { Medicacao } from '@core/medicacoes/tipos';
import { deveExplicarMarcacao, FRASE_MARCAR, rotuloEstadoDose, simboloDose, textoResumoAdesao } from '../rotulos';

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

describe('resumo da semana (check-in)', () => {
  const r: ResumoAdesao = {
    medicacaoId: 'm1', nome: 'Losartana', dose: '50 mg', unidade: 'comprimido', sePrecisar: false, previstas: 0, tomou: 0,
    naoTomou: 0, errado: 0, semRegistro: 0, comAtraso: 0, percentual: null, usosSePrecisar: 0, doses: [],
  };

  it('texto do resumo: só fatos, na ordem fixa, com plural', () => {
    expect(textoResumoAdesao({ ...r, previstas: 14, tomou: 12, naoTomou: 1, semRegistro: 1, errado: 0, comAtraso: 0 })).toBe('12 de 14 · 1 não tomada · 1 sem registro');
    expect(textoResumoAdesao({ ...r, previstas: 7, tomou: 7, naoTomou: 0, semRegistro: 0, errado: 0, comAtraso: 0 })).toBe('7 de 7 ✓');
    expect(textoResumoAdesao({ ...r, previstas: 14, tomou: 11, naoTomou: 2, semRegistro: 0, errado: 1, comAtraso: 2 })).toBe('11 de 14 · 2 não tomadas · 1 errada · 2 com atraso');
    expect(textoResumoAdesao({ ...r, previstas: 4, tomou: 1, naoTomou: 0, semRegistro: 1, errado: 2, comAtraso: 0 })).toBe('1 de 4 · 2 erradas · 1 sem registro');
    expect(textoResumoAdesao({ ...r, previstas: 7, tomou: 7, comAtraso: 2 })).toBe('7 de 7 ✓ · 2 com atraso'); // R-T9-b
    expect(textoResumoAdesao({ ...r, previstas: 0, tomou: 0 })).toBe('0 de 0'); // sem dose fechada: sem ✓
  });

  it('"se precisar" conta os usos', () => {
    expect(textoResumoAdesao({ ...r, sePrecisar: true, usosSePrecisar: 3 })).toBe('usou 3 vezes');
    expect(textoResumoAdesao({ ...r, sePrecisar: true, usosSePrecisar: 1 })).toBe('usou 1 vez');
  });

  it('símbolo de cada dose; pendente fica de fora', () => {
    const estados: EstadoDose[] = ['tomou', 'nao_tomou', 'sem_registro', 'errado', 'pendente'];
    expect(estados.map(simboloDose)).toEqual(['●', '○', '–', '⚠', null]);
  });
});
