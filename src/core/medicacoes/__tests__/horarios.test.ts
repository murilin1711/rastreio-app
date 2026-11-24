import { formatarHorarios, horaCurta, mesclarQuantidades, normalizarHorario, parsearHorarios } from '../horarios';

test('aceita 8, 08, 8:00, 08h, 20h30, 20:30', () => {
  expect(normalizarHorario('8')).toBe('08:00');
  expect(normalizarHorario('08')).toBe('08:00');
  expect(normalizarHorario('8:00')).toBe('08:00');
  expect(normalizarHorario('08h')).toBe('08:00');
  expect(normalizarHorario('20h30')).toBe('20:30');
  expect(normalizarHorario('20:30')).toBe('20:30');
});

test('rejeita inválidos', () => {
  expect(normalizarHorario('25:00')).toBeNull();
  expect(normalizarHorario('abc')).toBeNull();
  expect(normalizarHorario('12:75')).toBeNull();
  expect(normalizarHorario('')).toBeNull();
});

test('parseia lista separada por vírgula, espaço ou barra e ordena', () => {
  expect(parsearHorarios('20h, 8')).toEqual({ horarios: ['08:00', '20:00'], invalidos: [] });
  expect(parsearHorarios('8 / 14:00 / x')).toEqual({ horarios: ['08:00', '14:00'], invalidos: ['x'] });
  expect(parsearHorarios('')).toEqual({ horarios: [], invalidos: [] });
});

test('formata lista como "08h / 20h30"', () => {
  expect(formatarHorarios(['08:00', '20:00'])).toBe('08h / 20h');
  expect(formatarHorarios(['20:30'])).toBe('20h30');
  expect(formatarHorarios([])).toBe('');
});

/** D-045: quantas vezes por dia + primeira dose, e o caminho de volta ao editar. */
import { horariosDoRitmo, ritmoDe } from '../horarios';

describe('horariosDoRitmo', () => {
  it('reparte o dia a partir da primeira dose e ordena pelo relógio', () => {
    expect(horariosDoRitmo('08:00', 1)).toEqual(['08:00']);
    expect(horariosDoRitmo('08:00', 2)).toEqual(['08:00', '20:00']);
    expect(horariosDoRitmo('06:00', 3)).toEqual(['06:00', '14:00', '22:00']);
    expect(horariosDoRitmo('07:30', 4)).toEqual(['01:30', '07:30', '13:30', '19:30']);
  });
  it('primeira dose à noite passa da meia-noite', () => {
    expect(horariosDoRitmo('20:00', 2)).toEqual(['08:00', '20:00']);
    expect(horariosDoRitmo('22:00', 3)).toEqual(['06:00', '14:00', '22:00']);
  });
});

describe('ritmoDe', () => {
  it('reconhece o ritmo de horários igualmente espaçados', () => {
    expect(ritmoDe(['08:00'])).toBe(1);
    expect(ritmoDe(['08:00', '20:00'])).toBe(2);
    expect(ritmoDe(['06:00', '14:00', '22:00'])).toBe(3);
    expect(ritmoDe(['01:30', '07:30', '13:30', '19:30'])).toBe(4);
  });
  it('o que a pessoa ajustou à mão é "outro"', () => {
    expect(ritmoDe(['08:00', '19:00'])).toBe('outro');
    expect(ritmoDe(['08:00', '12:00', '18:00', '22:00', '23:00'])).toBe('outro');
    expect(ritmoDe([])).toBe('outro');
  });
});

test('horaCurta: 8h, 20h30, 0h15', () => {
  expect(horaCurta('08:00')).toBe('8h');
  expect(horaCurta('20:30')).toBe('20h30');
  expect(horaCurta('00:15')).toBe('0h15');
});

test('mesclarQuantidades mantém a quantidade de quem continua; hora nova entra com 1', () => {
  expect(mesclarQuantidades(['08:00', '14:00'], [{ hora: '08:00', quantidade: 2 }, { hora: '20:00', quantidade: 1 }]))
    .toEqual([{ hora: '08:00', quantidade: 2 }, { hora: '14:00', quantidade: 1 }]);
});

import { rotaTomar } from '../horarios';

describe('rotaTomar', () => {
  it('remédio e horário; a data só quando vem', () => {
    expect(rotaTomar('m1', '08:00')).toBe('/(app)/remedios/tomar?med=m1&hora=08:00');
    expect(rotaTomar('m1', '20:30', '2026-11-23')).toBe('/(app)/remedios/tomar?med=m1&hora=20:30&data=2026-11-23');
  });
  it('sem horário ("se precisar"): só o remédio', () => {
    expect(rotaTomar('m1')).toBe('/(app)/remedios/tomar?med=m1');
  });
});
