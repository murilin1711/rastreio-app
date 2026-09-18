import { ckdEpi2021 } from '../ckdEpi';

test('CKD-EPI 2021 sem raça (calculados pela fórmula publicada; conferir na calculadora NKF)', () => {
  expect(ckdEpi2021(0.8, 50, 'feminino')).toBeCloseTo(89.7, 1);
  expect(ckdEpi2021(1.2, 65, 'masculino')).toBeCloseTo(67.1, 1);
  expect(ckdEpi2021(0.9, 40, 'masculino')).toBeCloseTo(110.7, 1);
});
