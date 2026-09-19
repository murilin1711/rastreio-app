import { deveComemorarMeta, metaSugeridaMl, totalDoDiaMl } from '../agua';

test('meta sugerida: 35 ml por quilo, arredondada para 50 ml', () => {
  expect(metaSugeridaMl(70, false)).toBe(2450);
  expect(metaSugeridaMl(62.3, false)).toBe(2200); // 2180,5 -> 2200
  expect(metaSugeridaMl(100, false)).toBe(3500);
});
test('sem peso registrado não há meta sugerida', () => {
  expect(metaSugeridaMl(null, false)).toBeNull();
});
test('com restrição hídrica o app não calcula meta nenhuma', () => {
  expect(metaSugeridaMl(70, true)).toBeNull();
});
test('total do dia soma só os registros daquele dia', () => {
  const regs = [
    { medidoEm: '2026-09-19T08:00:00', ml: 200 },
    { medidoEm: '2026-09-19T14:30:00', ml: 500 },
    { medidoEm: '2026-09-18T22:00:00', ml: 300 },
  ];
  expect(totalDoDiaMl(regs, '2026-09-19')).toBe(700);
  expect(totalDoDiaMl(regs, '2026-09-18')).toBe(300);
  expect(totalDoDiaMl(regs, '2026-09-17')).toBe(0);
});
test('comemora ao bater a meta do dia', () => {
  expect(deveComemorarMeta(2450, 2450, null, '2026-09-19')).toBe(true);
  expect(deveComemorarMeta(3000, 2450, null, '2026-09-19')).toBe(true);
});
test('não comemora antes de bater', () => {
  expect(deveComemorarMeta(2400, 2450, null, '2026-09-19')).toBe(false);
});
test('não repete a comemoração no mesmo dia', () => {
  expect(deveComemorarMeta(3000, 2450, '2026-09-19', '2026-09-19')).toBe(false);
});
test('comemora de novo no dia seguinte: é diária, não única', () => {
  expect(deveComemorarMeta(2500, 2450, '2026-09-18', '2026-09-19')).toBe(true);
});
test('sem meta definida não há o que comemorar', () => {
  expect(deveComemorarMeta(3000, null, null, '2026-09-19')).toBe(false);
});
