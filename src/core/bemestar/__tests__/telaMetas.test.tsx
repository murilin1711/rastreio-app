/**
 * Regressão da tela Minhas Metas (D-016): o marco de meta é comemorado e gravado UMA vez.
 * O efeito que detecta o marco chama `marcar`, que recarrega as metas — a mesma forma do bug
 * de recarga infinita do Cardio. Renderiza a tela com repositórios simulados e conta as gravações.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockMarcacoes: { id: string; marco: number }[] = [];
(globalThis as any).mockReact = React;

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { cb(); }, [cb]); },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/bemestar/useCorpo', () => ({
  useCorpo: () => ({
    // partiu de 90 kg, meta 80, está em 85 => 50% do caminho
    ultimos: { peso: { valores: { kg: 85 } }, cintura: null },
    perfil: { objetivoPeso: 'reducao' },
    salvarObjetivo: jest.fn(),
  }),
}));
jest.mock('@core/bemestar/useSono', () => ({ useSono: () => ({ resumo: null }) }));
jest.mock('@core/bemestar/useAtividades', () => ({
  useAtividades: () => ({
    semana: null,
    metas: {
      metas: [{ id: 'm1', tipo: 'peso', valor: 80, origem: 'usuario', detalhe: null, ativa: true, valorInicial: 90, marcoComemorado: 0 }],
      porTipo: () => null,
      carregando: false,
      definir: jest.fn(),
      desativar: jest.fn(),
      marcar: async (id: string, marco: number) => { mockMarcacoes.push({ id, marco }); },
      recarregar: jest.fn(),
    },
  }),
}));

const Metas = require('../../../../app/(app)/bem-estar/metas/index').default;

beforeEach(() => { mockMarcacoes = []; });

it('grava o marco de 50% uma única vez, mesmo com as metas recarregando', async () => {
  await act(async () => { create(<Metas />); });
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(mockMarcacoes).toEqual([{ id: 'm1', marco: 50 }]);
}, 10000);
