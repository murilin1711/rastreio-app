/**
 * Regressão (19/09/2026): a tela do Cardio entrava em "Maximum update depth exceeded" porque `useGlicemia`
 * devolvia um `recarregar` novo a cada render e a tela o usa como dependência de `useFocusEffect`.
 * Renderiza a tela com repositórios simulados e confere que as recargas param.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockRecargasMrpa = 0;
(globalThis as any).mockReact = React;

jest.mock('expo-router', () => ({
  // Mesmo contrato do useFocusEffect real: roda de novo quando a identidade do callback muda.
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { cb(); }, [cb]); },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/cardio/regras', () => ({ carregarRegrasCardio: async () => [] }));
jest.mock('@core/regras/cardio/parametros', () => ({ extrairParametros: () => ({}) }));
jest.mock('@core/regras/cardio/parametrosRisco', () => ({ extrairParametrosRisco: () => ({}) }));
jest.mock('@core/regras/cardio/parametrosGlicemia', () => ({ extrairParametrosGlicemia: () => ({}) }));
jest.mock('@core/regras/cardio/pressao', () => ({ avaliarMedidaCasual: () => null, deveConvidarMrpa: () => false, resumoCasual: () => null, validarPlausibilidade: () => null }));
jest.mock('@core/regras/cardio/glicemia', () => ({ avaliarGlicemia: () => null, metasPara: () => ({}), resumoGlicemia: () => null }));
jest.mock('@core/regras/cardio/checkup', () => ({ avaliarCheckup: () => ({ itens: [], total: 0, atualizados: 0 }) }));
jest.mock('@core/cardio/sessoesMrpa', () => ({ sessaoAtiva: async () => { mockRecargasMrpa++; return null; }, buscarSessao: async () => null }));
jest.mock('@core/cardio/medidas', () => new Proxy({}, { get: (_t, k) => async () => (k === 'ultimoConviteMrpaEm' ? null : []) }));
jest.mock('@core/cardio/glicemia', () => new Proxy({}, { get: () => async () => [] }));
jest.mock('@core/perfil/repositorio', () => ({ obterPerfil: async () => ({ temDiabetes: false, nome: 'X' }), listarAntecedentes: async () => [] }));
jest.mock('@core/cardio/resumoHome', () => ({ montarFontesCheckup: async () => ({}) }));
jest.mock('@core/cardio/examesCardio', () => ({ ultimoPorTipo: async () => ({}) }));
jest.mock('@core/cardio/riscoCv', () => ({ ultimoRisco: async () => null }));
jest.mock('@core/supabase/client', () => {
  const q: Record<string, unknown> = {};
  for (const m of ['from', 'select', 'eq', 'order', 'limit', 'gte', 'lte', 'in', 'is']) q[m] = () => q;
  q.maybeSingle = async () => ({ data: null, error: null });
  return { supabase: { from: () => q } };
});

const Coracao = require('../../../../app/(app)/coracao/index').default;

it('a tela do Cardio estabiliza depois de carregar (sem loop de recarga)', async () => {
  await act(async () => { create(<Coracao />); });
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  // montagem + foco + perfil carregado; antes da correção passava de 200 em menos de 1 s
  expect(mockRecargasMrpa).toBeLessThanOrEqual(4);
}, 10000);
