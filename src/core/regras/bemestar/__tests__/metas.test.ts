import { marcoNovo, progressoMeta } from '../metas';

test('progresso de meta de redução: metade do caminho é 0,5', () => {
  expect(progressoMeta(90, 80, 90)).toBe(0);
  expect(progressoMeta(90, 80, 85)).toBe(0.5);
  expect(progressoMeta(90, 80, 80)).toBe(1);
});
test('progresso de meta de ganho usa a mesma fórmula', () => {
  expect(progressoMeta(60, 70, 65)).toBe(0.5);
  expect(progressoMeta(60, 70, 70)).toBe(1);
});
test('passar do alvo não limita o progresso em 1', () => {
  expect(progressoMeta(90, 80, 75)).toBe(1.5);
});
test('andar para o lado errado dá progresso negativo, não erro', () => {
  expect(progressoMeta(90, 80, 95)).toBe(-0.5);
});
test('sem ponto de partida, ou partida igual ao alvo, não há progresso', () => {
  expect(progressoMeta(null, 80, 85)).toBeNull();
  expect(progressoMeta(80, 80, 80)).toBeNull();
});
test('marco novo só aparece ao cruzar 50% e 100%', () => {
  expect(marcoNovo(0.49, 0)).toBeNull();
  expect(marcoNovo(0.5, 0)).toBe(50);
  expect(marcoNovo(1, 0)).toBe(100);
});
test('marco já comemorado não se repete', () => {
  expect(marcoNovo(0.7, 50)).toBeNull();
  expect(marcoNovo(1, 50)).toBe(100);
  expect(marcoNovo(1.5, 100)).toBeNull();
});
test('perder o progresso não tira o marco nem avisa', () => {
  expect(marcoNovo(0.1, 50)).toBeNull();
  expect(marcoNovo(-0.5, 100)).toBeNull();
});
test('sem progresso não há marco', () => {
  expect(marcoNovo(null, 0)).toBeNull();
});
