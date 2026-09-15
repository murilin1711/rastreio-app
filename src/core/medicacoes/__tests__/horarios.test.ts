import { formatarHorarios, normalizarHorario, parsearHorarios } from '../horarios';

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
