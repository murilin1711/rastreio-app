import { nomeCurto } from '../componentes/statusUI';

it('tira "Câncer" e a preposição, com maiúscula só na primeira letra', () => {
  expect(nomeCurto('Câncer de mama')).toBe('Mama');
  expect(nomeCurto('Câncer do colo do útero')).toBe('Colo do útero');
  expect(nomeCurto('Câncer de pulmão')).toBe('Pulmão');
  expect(nomeCurto('Câncer colorretal')).toBe('Colorretal');
  expect(nomeCurto('Câncer de próstata')).toBe('Próstata');
});
