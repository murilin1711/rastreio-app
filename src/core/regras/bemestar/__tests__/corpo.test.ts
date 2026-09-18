import { calcularIMC } from '@core/perfil/calculos';
import { avaliarPMAV, classificarCintura, classificarRCA, classificarRCQ, compararPeriodos, evolucaoPercentual, faixaIMC, faixaIMCIdoso, perdaNaoIntencional, rca, rcq, tendenciaPeso } from '../corpo';
import { extrairParametrosBemEstar } from '../parametros';
import type { MedidaCorporal } from '../tipos';
import { regrasBemEstarTeste } from './fixtures';

const p = extrairParametrosBemEstar(regrasBemEstarTeste());
const peso = (dia: string, kg: number) => ({ medidoEm: `${dia}T08:00:00.000Z`, kg });

describe('IMC (C-015)', () => {
  test('faixas OMS/ABESO 2016', () => {
    expect(calcularIMC(82, 170)).toBeCloseTo(28.4, 1);
    expect(faixaIMC(28.4, p).faixa).toBe('sobrepeso');
    expect(faixaIMC(17.9, p).faixa).toBe('baixo_peso');
    expect(faixaIMC(18.5, p).faixa).toBe('referencia');
    expect(faixaIMC(24.9, p).faixa).toBe('referencia');
    expect(faixaIMC(25, p).faixa).toBe('sobrepeso');
    expect(faixaIMC(30, p).faixa).toBe('obesidade_1');
    expect(faixaIMC(35, p).faixa).toBe('obesidade_2');
    expect(faixaIMC(40, p).faixa).toBe('obesidade_3');
    expect(faixaIMC(28.4, p).regra.id).toBe('b-imc');
  });
  test('idoso: faixa do MS só a partir dos 60', () => {
    expect(faixaIMCIdoso(26, 65, p)?.faixa).toBe('referencia');
    expect(faixaIMCIdoso(21, 65, p)?.faixa).toBe('baixo_peso');
    expect(faixaIMCIdoso(27.5, 70, p)?.faixa).toBe('excesso');
    expect(faixaIMCIdoso(26, 59, p)).toBeNull();
    expect(faixaIMCIdoso(26, null, p)).toBeNull();
  });
});

describe('cintura, RCA e RCQ (C-016)', () => {
  test('RCA com 2 casas e limite 0,5', () => {
    expect(rca(96, 170)).toBe(0.56);
    expect(classificarRCA(0.56, p).acima).toBe(true);
    expect(rca(78, 165)).toBe(0.47);
    expect(classificarRCA(0.47, p).acima).toBe(false);
    expect(classificarRCA(0.5, p).acima).toBe(false);
  });
  test('cintura por sexo: IDF sul-americanos e NCEP', () => {
    expect(classificarCintura(96, 'masculino', p).faixa).toBe('aumentado');
    expect(classificarCintura(103, 'masculino', p).faixa).toBe('muito_aumentado');
    expect(classificarCintura(89, 'masculino', p).faixa).toBe('referencia');
    expect(classificarCintura(79, 'feminino', p).faixa).toBe('referencia');
    expect(classificarCintura(80, 'feminino', p).faixa).toBe('aumentado');
    expect(classificarCintura(88, 'feminino', p).faixa).toBe('muito_aumentado');
  });
  test('RCQ', () => {
    expect(rcq(96, 102)).toBe(0.94);
    expect(classificarRCQ(0.94, 'masculino', p).acima).toBe(true);
    expect(classificarRCQ(0.84, 'feminino', p).acima).toBe(false);
    expect(classificarRCQ(0.85, 'feminino', p).acima).toBe(true);
  });
});

describe('tendência e evolução (C-019)', () => {
  test('exige 3 medidas e 14 dias de janela', () => {
    expect(tendenciaPeso([peso('2026-09-01', 80), peso('2026-09-15', 79)], '2026-09-18', p)).toBeNull();
    expect(tendenciaPeso([peso('2026-09-08', 80), peso('2026-09-12', 79.5), peso('2026-09-18', 79)], '2026-09-18', p)).toBeNull();
  });
  test('compara médias de duas janelas de 14 dias', () => {
    const reducao = [peso('2026-08-22', 80), peso('2026-08-29', 80), peso('2026-09-06', 79), peso('2026-09-16', 79)];
    expect(tendenciaPeso(reducao, '2026-09-18', p)).toBe('reducao');
    const estavel = [peso('2026-08-22', 80), peso('2026-08-29', 80), peso('2026-09-06', 80.5), peso('2026-09-16', 80.5)];
    expect(tendenciaPeso(estavel, '2026-09-18', p)).toBe('estavel');
    const aumento = [peso('2026-08-22', 80), peso('2026-08-29', 80), peso('2026-09-06', 81), peso('2026-09-16', 81.5)];
    expect(tendenciaPeso(aumento, '2026-09-18', p)).toBe('aumento');
  });
  test('janela anterior vazia → null', () => {
    expect(tendenciaPeso([peso('2026-09-05', 80), peso('2026-09-10', 79), peso('2026-09-18', 78)], '2026-09-18', p)).toBeNull();
  });
  test('evolução percentual com 1 casa e sinal', () => {
    expect(evolucaoPercentual(82, 76)).toBe(-7.3);
    expect(evolucaoPercentual(70, 72.1)).toBe(3);
  });
});

describe('PMAV (ABESO 2026 R8)', () => {
  test('marcos por faixa de IMC', () => {
    expect(avaliarPMAV(82, 95, 28.4, p)).toMatchObject({ perdaPct: 13.7, faixa: null });
    expect(avaliarPMAV(82, 95, 31, p).faixa).toBe('controlada');
    expect(avaliarPMAV(93, 100, 32, p).faixa).toBe('reduzida');
    expect(avaliarPMAV(97, 100, 32, p).faixa).toBe('nenhuma');
    expect(avaliarPMAV(88, 100, 42, p).faixa).toBe('reduzida');
    expect(avaliarPMAV(84, 100, 42, p).faixa).toBe('controlada');
    expect(avaliarPMAV(82, 95, 31, p).regra.id).toBe('b-pmav');
  });
});

describe('perda não intencional (C-019)', () => {
  const serie = [peso('2026-04-10', 80), peso('2026-06-10', 78), peso('2026-09-10', 75.5)];
  test('sem meta de redução e queda ≥ 5 % em ≤ 6 meses', () => {
    expect(perdaNaoIntencional(serie, 'manutencao', '2026-09-18', p)).toMatchObject({ pct: 5.6, desde: '2026-04-10' });
    expect(perdaNaoIntencional(serie, null, '2026-09-18', p)?.pct).toBe(5.6);
  });
  test('com meta de redução, ou queda menor, ou fora da janela → null', () => {
    expect(perdaNaoIntencional(serie, 'reducao', '2026-09-18', p)).toBeNull();
    expect(perdaNaoIntencional([peso('2026-06-10', 78), peso('2026-09-10', 76)], 'manutencao', '2026-09-18', p)).toBeNull();
    expect(perdaNaoIntencional([peso('2025-12-10', 80), peso('2026-09-10', 75)], 'manutencao', '2026-09-18', p)).toBeNull();
  });
});

describe('comparar períodos (§73)', () => {
  const m = (id: string, tipo: MedidaCorporal['tipo'], dia: string, valores: MedidaCorporal['valores']): MedidaCorporal => ({ id, tipo, medidoEm: `${dia}T08:00:00.000Z`, valores });
  test('primeira → última de cada tipo presente no período', () => {
    const r = compararPeriodos([
      m('1', 'peso', '2026-01-05', { kg: 74.2 }), m('2', 'peso', '2026-09-05', { kg: 68.4 }), m('3', 'peso', '2026-12-01', { kg: 60 }),
      m('4', 'cintura', '2026-01-06', { cm: 88 }), m('5', 'cintura', '2026-09-01', { cm: 78 }),
      m('6', 'composicao', '2026-02-01', { gordura_pct: 31, massa_muscular_kg: 24 }), m('7', 'composicao', '2026-08-01', { gordura_pct: 27 }),
    ], '2026-01-01', '2026-09-30');
    expect(r).toEqual({ peso: [74.2, 68.4], cintura: [88, 78], gorduraPct: [31, 27], massaMuscularKg: [24, 24] });
  });
  test('sem medidas → objeto vazio', () => expect(compararPeriodos([], '2026-01-01', '2026-09-30')).toEqual({}));
});
