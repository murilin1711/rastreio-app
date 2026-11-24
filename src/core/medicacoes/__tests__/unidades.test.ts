import { UNIDADES, formatarQuantidade, numeroBr } from '../unidades';

test('passo da quantidade por unidade', () => {
  expect(UNIDADES.comprimido.passo).toBe(0.5);
  expect(UNIDADES.gota.passo).toBe(1);
  expect(UNIDADES.unidade.passo).toBe(1);
  expect(UNIDADES.ml.passo).toBe(0.5);
  expect(UNIDADES.jato.passo).toBe(1);
});

test('formata a quantidade com a unidade, por extenso nas metades de comprimido', () => {
  expect(formatarQuantidade(1, 'comprimido')).toBe('1 comprimido');
  expect(formatarQuantidade(2, 'comprimido')).toBe('2 comprimidos');
  expect(formatarQuantidade(0.5, 'comprimido')).toBe('meio comprimido');
  expect(formatarQuantidade(1.5, 'comprimido')).toBe('1 comprimido e meio');
  expect(formatarQuantidade(2.5, 'comprimido')).toBe('2 comprimidos e meio');
  expect(formatarQuantidade(10, 'gota')).toBe('10 gotas');
  expect(formatarQuantidade(8, 'unidade')).toBe('8 unidades');
  expect(formatarQuantidade(2.5, 'ml')).toBe('2,5 mL');
  expect(formatarQuantidade(1, 'jato')).toBe('1 jato');
});

test('pergunta e rótulos', () => {
  expect(UNIDADES.comprimido.pergunta).toBe('Quantos comprimidos?');
  expect(UNIDADES.gota.pergunta).toBe('Quantas gotas?');
  expect(UNIDADES.comprimido.rotulo).toBe('Comprimido');
  expect(UNIDADES.unidade.rotulo).toBe('Unidade (insulina)');
  expect(UNIDADES.ml.rotulo).toBe('mL');
  expect(UNIDADES.ml.plural).toBe('mL');
  expect(UNIDADES.jato.rotulo).toBe('Jato ou inalação');
});

test('número no formato brasileiro', () => {
  expect(numeroBr(1.5)).toBe('1,5');
  expect(numeroBr(2)).toBe('2');
});
