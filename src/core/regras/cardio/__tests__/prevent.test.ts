import { extrairParametrosRisco } from '../parametrosRisco';
import { calcularPrevent, categoriaPrevent, elegivelPrevent, logitPrevent, modeloPara } from '../prevent';
import { COEFICIENTES, DISPONIVEL } from '../prevent.coeficientes';
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

test('coeficientes disponíveis (gerados do suplemento oficial)', () => {
  expect(DISPONIVEL).toBe(true);
  expect(COEFICIENTES.prevent_base.feminino['10'].intercepto).toBe(-3.819975);
  expect(COEFICIENTES.prevent_base.masculino['30'].idade2).toBe(-0.0937484);
});

/**
 * Exemplo oficial do suplemento (planilha "withcalc", Tabelas S12A/B/C/E/F): mulher/homem de 50 anos, CT 200, HDL 45,
 * PAS 160 tratada, diabetes, não fumante, IMC 35, TFG 90, sem estatina. Riscos ASCVD calculados na própria planilha.
 */
const exemplo = { idade: 50, colesterolTotal: 200, hdl: 45, pas: 160, antiHipertensivo: true, estatina: false, diabetes: true, tabagismoAtual: false, imc: 35, tfg: 90 };
const pct = (x: number) => Math.round(x * 1000) / 10;

describe('validação contra os exemplos do suplemento de Khan 2024', () => {
  test('base 10 anos: mulher 9,2 % · homem 10,2 %', () => {
    expect(calcularPrevent({ ...exemplo, sexo: 'feminino' }).ascvd10).toBe(pct(0.09195089753632872));
    expect(calcularPrevent({ ...exemplo, sexo: 'masculino' }).ascvd10).toBe(pct(0.10194362642179755));
  });
  test('base 30 anos: mulher 35,4 % · homem 34,9 %', () => {
    expect(calcularPrevent({ ...exemplo, sexo: 'feminino' }).ascvd30).toBe(pct(0.3542551988690411));
    expect(calcularPrevent({ ...exemplo, sexo: 'masculino' }).ascvd30).toBe(pct(0.3485940384298915));
  });
  test('+HbA1c 7,5 (S12C): mulher 8,3 % · homem 9,4 %', () => {
    expect(calcularPrevent({ ...exemplo, sexo: 'feminino', hba1c: 7.5 })).toMatchObject({ modelo: 'prevent_hba1c', ascvd10: pct(0.08349803993883279) });
    expect(calcularPrevent({ ...exemplo, sexo: 'masculino', hba1c: 7.5 }).ascvd10).toBe(pct(0.0936805851781576));
  });
  test('+RAC 40 mg/g (S12B): mulher 9,9 % · homem 11,0 %', () => {
    expect(calcularPrevent({ ...exemplo, sexo: 'feminino', rac: 40 })).toMatchObject({ modelo: 'prevent_rac', ascvd10: pct(0.09944272308807872) });
    expect(calcularPrevent({ ...exemplo, sexo: 'masculino', rac: 40 }).ascvd10).toBe(pct(0.10970272324914827));
  });
  test('completo com SDI decil 7–10 (S12E, só para validar a máquina): mulher 9,6 % · homem 11,0 %', () => {
    expect(calcularPrevent({ ...exemplo, sexo: 'feminino', hba1c: 7.5, rac: 40 }, '7-10')).toMatchObject({ modelo: 'prevent_hba1c_rac', ascvd10: pct(0.09638939920734979) });
    expect(calcularPrevent({ ...exemplo, sexo: 'masculino', hba1c: 7.5, rac: 40 }, '7-10').ascvd10).toBe(pct(0.11003502331956223));
  });
  test('completo no app: SDI ausente usa o coeficiente "Missing SDI"', () => {
    const c = COEFICIENTES.prevent_hba1c_rac.feminino['10'];
    const e = { ...exemplo, sexo: 'feminino' as const, hba1c: 7.5, rac: 40 };
    expect(logitPrevent(e, c, 'ausente') - logitPrevent(e, c, '1-3')).toBeCloseTo(c.sdiAusente!, 10);
  });
  test('log-odds exato do exemplo base ASCVD (mulher): −2,2900', () => {
    expect(logitPrevent({ ...exemplo, sexo: 'feminino' }, COEFICIENTES.prevent_base.feminino['10'])).toBeCloseTo(-2.2900437426049995, 6);
  });
  test('30 anos só até 59 anos', () => {
    expect(calcularPrevent({ ...exemplo, sexo: 'feminino', idade: 60 }).ascvd30).toBeNull();
  });
});
