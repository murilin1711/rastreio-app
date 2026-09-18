import { resumoAlimentacaoSemana } from '../alimentacao';
import { semanaDe } from '../atividade';
import type { Refeicao } from '../tipos';

const r = (id: string, em: string, tipo: Refeicao['tipo']): Refeicao => ({ id, em, tipo, descricao: 'x', quantidade: null, fomeAntes: null, saciedade: null, local: null, observacao: null });
const semana = semanaDe('2026-09-18'); // 14–20/09

test('resumo da semana: dias, horários médios, variação e padrão', () => {
  const lista = [
    r('1', '2026-09-14T07:30:00', 'cafe'), r('2', '2026-09-15T07:50:00', 'cafe'), r('3', '2026-09-16T07:45:00', 'cafe'),
    r('4', '2026-09-14T12:30:00', 'almoco'), r('5', '2026-09-15T13:00:00', 'almoco'), r('6', '2026-09-17T13:30:00', 'almoco'), r('7', '2026-09-18T12:50:00', 'almoco'),
    r('8', '2026-09-16T20:00:00', 'jantar'), r('9', '2026-09-19T21:30:00', 'jantar'),
    r('10', '2026-09-10T12:00:00', 'almoco'), // fora da semana
  ];
  const s = resumoAlimentacaoSemana(lista, semana);
  expect(s.diasComRegistro).toBe(6);
  expect(s.totalRefeicoes).toBe(9);
  expect(s.horarioMedio.cafe).toBe('07:42');
  expect(s.horarioMedio.almoco).toBe('12:57');
  expect(s.horarioMedio.jantar).toBe('20:45');
  expect(s.variacaoMin.jantar).toBe(45);
  expect(s.variacaoMin.cafe).toBe(9);
  expect(s.padrao).toBe('semelhantes');
  expect(s.porDia).toHaveLength(7);
  expect(s.porDia.map((d) => d.refeicoes)).toEqual([2, 2, 2, 1, 1, 1, 0]);
});
test('padrão "variaram" quando alguma refeição principal varia mais de 90 min; null sem refeições principais', () => {
  const variada = [r('1', '2026-09-14T19:00:00', 'jantar'), r('2', '2026-09-15T23:00:00', 'jantar'), r('3', '2026-09-16T20:00:00', 'jantar')];
  expect(resumoAlimentacaoSemana(variada, semana).padrao).toBe('variaram');
  expect(resumoAlimentacaoSemana([r('1', '2026-09-14T16:00:00', 'lanche')], semana).padrao).toBeNull();
  expect(resumoAlimentacaoSemana([], semana)).toMatchObject({ diasComRegistro: 0, totalRefeicoes: 0, horarioMedio: {}, variacaoMin: {}, padrao: null });
});
