import { checkinPendente, mediasMensais, semanaDoCheckin } from '../checkin';
import type { Checkin } from '../tipos';

const ck = (id: string, semana: string, energia: number | null, estresse: number | null, bemEstar: number | null): Checkin => ({ id, semana, disposicao: null, alimentacao: null, atividade: null, sono: null, estresse, energia, bemEstar, observacao: null });

test('semana avaliada: anterior, exceto domingo (atual)', () => {
  expect(semanaDoCheckin('2026-09-14')).toBe('2026-09-07'); // segunda
  expect(semanaDoCheckin('2026-09-16')).toBe('2026-09-07'); // quarta
  expect(semanaDoCheckin('2026-09-20')).toBe('2026-09-14'); // domingo
});
test('pendência só na janela dom/seg/ter e sem resposta', () => {
  expect(checkinPendente([], '2026-09-14')).toBe(true);
  expect(checkinPendente([], '2026-09-16')).toBe(false);
  expect(checkinPendente([ck('1', '2026-09-07', 7, 3, 8)], '2026-09-14')).toBe(false);
  expect(checkinPendente([], '2026-09-20')).toBe(true);
});
test('médias mensais com 1 casa, mais recente primeiro', () => {
  const m = mediasMensais([ck('1', '2026-09-07', 7, 3, 8), ck('2', '2026-09-14', 8, 4, 7), ck('3', '2026-08-24', 6, null, 6), ck('4', '2026-08-31', 5, 6, 6.5)]);
  expect(m).toEqual([{ mes: '2026-09', energia: 7.5, estresse: 3.5, bemEstar: 7.5, n: 2 }, { mes: '2026-08', energia: 5.5, estresse: 6, bemEstar: 6.3, n: 2 }]);
});
