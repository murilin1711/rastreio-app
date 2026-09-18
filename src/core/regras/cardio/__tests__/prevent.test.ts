import { extrairParametrosRisco } from '../parametrosRisco';
import { calcularPrevent, categoriaPrevent, CoeficientesIndisponiveis, elegivelPrevent, modeloPara } from '../prevent';
import { DISPONIVEL } from '../prevent.coeficientes';
import { regrasRiscoTeste } from './fixturesRisco';

const p = extrairParametrosRisco(regrasRiscoTeste());

describe('elegibilidade (Dislipidemias 2025 §4.2, §4.8–4.9)', () => {
  test.each([[29, false, 'idade'], [30, true, null], [79, true, null], [80, false, 'idade']])('idade %i → %s', (idade, ok, motivo) => {
    expect(elegivelPrevent({ idade, eventoCvPrevio: false }, p)).toEqual({ ok, motivo });
  });
  test('evento prévio → não se aplica', () => expect(elegivelPrevent({ idade: 50, eventoCvPrevio: true }, p).motivo).toBe('evento_previo'));
  test('sem idade → sem_idade', () => expect(elegivelPrevent({ idade: null, eventoCvPrevio: false }, p).motivo).toBe('sem_idade'));
});

describe('categorias (Tabela 4.1)', () => {
  test.each([[4.9, 'baixo'], [5, 'intermediario'], [19.9, 'intermediario'], [20, 'alto']])('%s % → %s', (v, cat) => expect(categoriaPrevent(v, p)).toBe(cat));
});

test('modelo conforme opcionais', () => {
  const base = { sexo: 'feminino' as const, idade: 50, colesterolTotal: 185, hdl: 57, pas: 128, antiHipertensivo: false, estatina: false, diabetes: false, tabagismoAtual: false, imc: 24.6, tfg: 90 };
  expect(modeloPara(base)).toBe('prevent_base');
  expect(modeloPara({ ...base, hba1c: 5.7 })).toBe('prevent_hba1c');
  expect(modeloPara({ ...base, rac: 10 })).toBe('prevent_rac');
  expect(modeloPara({ ...base, hba1c: 5.7, rac: 10 })).toBe('prevent_hba1c_rac');
});

test('sem coeficientes transcritos, o cálculo recusa (nunca inventa número)', () => {
  const e = { sexo: 'feminino' as const, idade: 50, colesterolTotal: 185, hdl: 57, pas: 128, antiHipertensivo: false, estatina: false, diabetes: false, tabagismoAtual: false, imc: 24.6, tfg: 90 };
  if (!DISPONIVEL) expect(() => calcularPrevent(e)).toThrow(CoeficientesIndisponiveis);
});
