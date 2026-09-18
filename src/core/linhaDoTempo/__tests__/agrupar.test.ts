import { agruparPorAno } from '../agrupar';

test('agrupa por ano, mais recente primeiro, e ordena dentro do ano', () => {
  const g = agruparPorAno([
    { data: '2025-03-01', modulo: 'cardio', titulo: 'a', valor: '' },
    { data: '2026-09-10', modulo: 'rastreando', titulo: 'b', valor: '' },
    { data: '2026-01-05', modulo: 'medicacao', titulo: 'c', valor: '' },
  ]);
  expect(g.map((x) => x.ano)).toEqual([2026, 2025]);
  expect(g[0].itens.map((i) => i.titulo)).toEqual(['b', 'c']);
});
test('vazio → vazio', () => expect(agruparPorAno([])).toEqual([]));
