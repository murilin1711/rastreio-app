/** D-056: a conta só segue para o app com os dois aceites na versão atual. */
jest.mock('@core/supabase/client', () => ({ supabase: {} }));
import { aceitesEmDia } from '../repositorio';

const T = '2026-09-26';

test('com os dois aceites na versão atual, está em dia', () => {
  expect(aceitesEmDia([{ tipo: 'termos', versao: T }, { tipo: 'dados_saude', versao: T }], T, T)).toBe(true);
});

test('faltando um dos dois, não está', () => {
  expect(aceitesEmDia([{ tipo: 'termos', versao: T }], T, T)).toBe(false);
  expect(aceitesEmDia([], T, T)).toBe(false);
});

test('aceite de versão antiga não vale depois que os termos mudam', () => {
  expect(aceitesEmDia([{ tipo: 'termos', versao: '2026-01-01' }, { tipo: 'dados_saude', versao: T }], T, T)).toBe(false);
});
