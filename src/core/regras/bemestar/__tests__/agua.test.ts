import { deveComemorarMeta, metaSugeridaMl, resumoAguaSemana, totalDoDiaMl } from '../agua';

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

// D-020 — resumo semanal para o relatório de Saúde & Hábitos.

const SEMANA = { inicio: '2026-09-14', fim: '2026-09-20' }; // segunda a domingo

test('resumo da semana: conta dias com registro, total e média por dia registrado', () => {
  const regs = [
    { medidoEm: '2026-09-14T08:00:00', ml: 500 },
    { medidoEm: '2026-09-14T15:00:00', ml: 500 },
    { medidoEm: '2026-09-16T09:00:00', ml: 2000 },
  ];
  const r = resumoAguaSemana(regs, SEMANA, null);
  expect(r.diasComRegistro).toBe(2);
  expect(r.totalMl).toBe(3000);
  expect(r.mediaDiariaMl).toBe(1500);
});

test('a média divide pelos dias registrados, não por sete', () => {
  // Dia sem registro não é dia sem beber: o app não sabe, e não pode inventar zero.
  const regs = [{ medidoEm: '2026-09-14T08:00:00', ml: 2000 }];
  expect(resumoAguaSemana(regs, SEMANA, null).mediaDiariaMl).toBe(2000);
});

test('resumo ignora registros de fora da semana', () => {
  const regs = [
    { medidoEm: '2026-09-13T23:00:00', ml: 900 },
    { medidoEm: '2026-09-15T10:00:00', ml: 400 },
    { medidoEm: '2026-09-21T07:00:00', ml: 900 },
  ];
  const r = resumoAguaSemana(regs, SEMANA, null);
  expect(r.diasComRegistro).toBe(1);
  expect(r.totalMl).toBe(400);
});

test('conta em quantos dias a meta foi batida', () => {
  const regs = [
    { medidoEm: '2026-09-14T08:00:00', ml: 2500 },
    { medidoEm: '2026-09-15T08:00:00', ml: 1000 },
    { medidoEm: '2026-09-16T08:00:00', ml: 2450 },
  ];
  expect(resumoAguaSemana(regs, SEMANA, 2450).diasQueBateramMeta).toBe(2);
});

test('sem meta definida não há dias batidos para contar', () => {
  const regs = [{ medidoEm: '2026-09-14T08:00:00', ml: 5000 }];
  expect(resumoAguaSemana(regs, SEMANA, null).diasQueBateramMeta).toBeNull();
});

test('semana sem nenhum registro devolve zeros, não divisão por zero', () => {
  const r = resumoAguaSemana([], SEMANA, 2450);
  expect(r.diasComRegistro).toBe(0);
  expect(r.totalMl).toBe(0);
  expect(r.mediaDiariaMl).toBeNull();
});
