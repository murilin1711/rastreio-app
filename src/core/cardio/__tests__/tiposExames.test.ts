import { categoriaDe, rotuloExame, TIPOS_CARDIO, TIPOS_LAB, unidadePadrao } from '../tiposExames';

test('listas fechadas da spec §4.4', () => {
  expect(TIPOS_LAB).toHaveLength(25);
  expect(TIPOS_CARDIO).toHaveLength(13);
  expect(TIPOS_LAB.filter((t) => t.chavePrevent).map((t) => t.chavePrevent).sort()).toEqual(['colesterolTotal', 'creatinina', 'hba1c', 'hdl', 'rac', 'tfg']);
});
test('rótulo, unidade e categoria', () => {
  expect(rotuloExame('ldl')).toBe('LDL-colesterol');
  expect(unidadePadrao('hba1c')).toBe('%');
  expect(categoriaDe('cac')).toBe('cardiologico');
  expect(categoriaDe('ldl')).toBe('laboratorial');
});
