import { marcoSequencia, resumoSequencia } from '../sequencia';

test('sem nenhum dia registrado, sequência zerada', () => {
  expect(resumoSequencia([], '2026-09-19')).toEqual({ sequencia: 0, total: 0 });
});
test('registrou hoje pela primeira vez: sequência de 1', () => {
  expect(resumoSequencia(['2026-09-19'], '2026-09-19')).toEqual({ sequencia: 1, total: 1 });
});
test('dias seguidos terminando hoje', () => {
  expect(resumoSequencia(['2026-09-17', '2026-09-18', '2026-09-19'], '2026-09-19')).toEqual({ sequencia: 3, total: 3 });
});
test('registrou ontem e ainda não hoje: a sequência continua viva', () => {
  expect(resumoSequencia(['2026-09-17', '2026-09-18'], '2026-09-19')).toEqual({ sequencia: 2, total: 2 });
});
test('passou um dia inteiro sem nada: sequência zera, total permanece', () => {
  expect(resumoSequencia(['2026-09-15', '2026-09-16', '2026-09-17'], '2026-09-19')).toEqual({ sequencia: 0, total: 3 });
});
test('buraco no meio só conta o trecho final', () => {
  expect(resumoSequencia(['2026-09-10', '2026-09-11', '2026-09-18', '2026-09-19'], '2026-09-19')).toEqual({ sequencia: 2, total: 4 });
});
test('dias fora de ordem ou repetidos não confundem a contagem', () => {
  expect(resumoSequencia(['2026-09-19', '2026-09-17', '2026-09-18', '2026-09-18'], '2026-09-19')).toEqual({ sequencia: 3, total: 3 });
});
test('a virada do mês não quebra a sequência', () => {
  expect(resumoSequencia(['2026-08-30', '2026-08-31', '2026-09-01'], '2026-09-01')).toEqual({ sequencia: 3, total: 3 });
});
test('marco só nos números escolhidos e só uma vez', () => {
  expect(marcoSequencia(2, 0)).toBeNull();
  expect(marcoSequencia(3, 0)).toBe(3);
  expect(marcoSequencia(7, 3)).toBe(7);
  expect(marcoSequencia(30, 7)).toBe(30);
  expect(marcoSequencia(100, 30)).toBe(100);
});
test('marco já comemorado não repete, e sequência quebrada não devolve marco', () => {
  expect(marcoSequencia(5, 3)).toBeNull();
  expect(marcoSequencia(3, 3)).toBeNull();
  expect(marcoSequencia(0, 30)).toBeNull();
});
test('sequência maior que 100 não gera marco novo', () => {
  expect(marcoSequencia(150, 100)).toBeNull();
});
