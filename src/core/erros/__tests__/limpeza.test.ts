/** D-058: o relatório de erros não pode levar dado de saúde nem identificar a pessoa. */
import { limparEvento, limparRastro } from '../limpeza';

test('toques e console são descartados: podem ter o texto da tela (nome de remédio, resultado)', () => {
  expect(limparRastro({ category: 'touch', message: 'Losartana 50' })).toBeNull();
  expect(limparRastro({ category: 'ui.click', message: 'x' })).toBeNull();
  expect(limparRastro({ category: 'console', message: 'glicemia 250' })).toBeNull();
});

test('endereços perdem os parâmetros (e-mail, filtros do banco)', () => {
  const r = limparRastro({ category: 'fetch', data: { url: 'https://x.supabase.co/rest/v1/medidas?user_id=eq.123&valor=eq.250', method: 'GET', status_code: 200 } });
  expect(r?.data?.url).toBe('https://x.supabase.co/rest/v1/medidas');
  expect(r?.data?.status_code).toBe(200);
  const n = limparRastro({ category: 'navigation', data: { from: '/confirmar?email=a@b.com', to: '/(app)/(tabs)?voltarPara=/' } });
  expect(n?.data).toEqual({ from: '/confirmar', to: '/(app)/(tabs)' });
});

test('o evento sai sem pessoa, sem requisição e sem extras', () => {
  const e = limparEvento({ message: 'boom', user: { id: 'u1', email: 'a@b.com', ip_address: '1.2.3.4' }, request: { url: 'x?y=1', data: 'corpo' }, extra: { perfil: {} }, exception: { values: [{ type: 'TypeError' }] } });
  expect(e.user).toBeUndefined();
  expect(e.request).toBeUndefined();
  expect(e.extra).toBeUndefined();
  expect(e.message).toBe('boom');
  expect(e.exception).toEqual({ values: [{ type: 'TypeError' }] });
});
