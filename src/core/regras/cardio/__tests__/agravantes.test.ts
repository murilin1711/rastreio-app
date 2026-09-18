import { LISTA_AGRAVANTES, temAgravante } from '../agravantes';

test('lista com os 17 itens da Tabela 4.3 (Dislipidemias 2025)', () => {
  expect(LISTA_AGRAVANTES).toHaveLength(17);
  expect(LISTA_AGRAVANTES.map((a) => a.id)).toContain('lpa_elevada');
  expect(LISTA_AGRAVANTES.find((a) => a.id === 'hist_familiar_dcv_prematura')?.detalhe).toContain('55');
});
test('temAgravante', () => {
  expect(temAgravante([])).toBe(false);
  expect(temAgravante(['hiv'])).toBe(true);
});
