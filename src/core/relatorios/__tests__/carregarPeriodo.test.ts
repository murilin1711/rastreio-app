/** periodoDias usa o calendário local (M9): às 22:30 de Brasília o ISO em UTC já é o dia seguinte. */
jest.mock('@core/supabase/client', () => ({ supabase: {} }));
import { periodoDias } from '../carregar';

test('às 22:30 local, "até" é o dia local e "desde" volta N dias no calendário local', () => {
  const hoje = new Date(2026, 8, 18, 22, 30);
  expect(periodoDias(30, hoje)).toEqual({ desde: '2026-08-19', ate: '2026-09-18', rotulo: 'últimos 30 dias' });
  expect(periodoDias(90, hoje)).toMatchObject({ desde: '2026-06-20', ate: '2026-09-18' });
});
