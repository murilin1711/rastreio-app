/**
 * Regressão (25/09/2026): o Murilo cadastrou um remédio com lembrete, voltou à Home e a tela
 * "Ativar avisos" nunca apareceu — o lembrete ficou silenciado. A Home só avaliava ao montar, e as
 * abas continuam montadas. Agora avalia toda vez que a Home ganha foco (D-042).
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

(globalThis as any).mockReact = React;
const mockAvaliar = jest.fn();
const mockFoco: (() => void)[] = [];

jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  useRouter: () => ({ push: jest.fn() }),
  // Guarda o callback de foco para o teste simular a volta à aba.
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { mockFoco.push(cb); cb(); }, [cb]); },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: { nome: 'M', semMedicacoes: true, semAntecedentesFamiliares: true }, antecedentes: [], carregando: false, recarregar: jest.fn(), salvar: jest.fn() }) }));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: [], recarregar: jest.fn() }) }));
jest.mock('@core/rastreando/useRastreando', () => ({ useRastreando: () => ({ avaliacoes: {}, pendencias: [], sintomas: [], carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/cardio/useResumoCardio', () => ({ useResumoCardio: () => ({ resumo: undefined, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/lembretes/useConsultas', () => ({ useConsultas: () => ({ proxima: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: null, perdaNaoIntencional: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useSequencia', () => ({ useSequencia: () => ({ sequencia: 0, marco: null, dispensarMarco: jest.fn() }) }));
jest.mock('@core/lembretes/useAvisos', () => ({ useAvisos: () => ({ precisa: false, ativar: jest.fn(), adiar: jest.fn(), avaliar: mockAvaliar }) }));
jest.mock('@core/cardio/lembretesCardio', () => ({ sincronizarLembretesMedicacao: async () => {} }));
jest.mock('@core/lembretes/preferencias', () => ({ renovarAvisosDiarios: async () => {} }));

const Home = require('../../../../app/(app)/(tabs)/index').default;

it('reavalia o pedido de avisos quando a Home volta a ter foco', async () => {
  await act(async () => { create(<Home />); });
  expect(mockFoco.length).toBeGreaterThan(0);
  const antes = mockAvaliar.mock.calls.length;
  await act(async () => { mockFoco.forEach((cb) => cb()); }); // voltou de Meus medicamentos: todo efeito de foco roda
  expect(mockAvaliar.mock.calls.length).toBe(antes + 1);
});
