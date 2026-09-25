/**
 * D-046 (pedido do Murilo em 25/09): a pendência resolvida em outra tela não pode sumir escondida.
 * Ao voltar para a Home, a pessoa vê a bolinha ficar verde e o item sair dali.
 */
import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

(globalThis as any).mockReact = React;
const mockEstado = { focada: true, ativas: 0, recargas: 0 };
const mockFoco: (() => void)[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useIsFocused: () => mockEstado.focada,
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { mockFoco.push(cb); cb(); }, [cb]); },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: { nome: 'M', semMedicacoes: false, semAntecedentesFamiliares: false }, antecedentes: [], carregando: false, recarregar: jest.fn(), salvar: jest.fn() }) }));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: Array.from({ length: mockEstado.ativas }, (_, i) => ({ id: `m${i}`, lembrar: false, horarios: [] })), recarregar: () => { mockEstado.recargas++; } }) }));
jest.mock('@core/rastreando/useRastreando', () => ({ useRastreando: () => ({ avaliacoes: {}, pendencias: [], sintomas: [], carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/cardio/useResumoCardio', () => ({ useResumoCardio: () => ({ resumo: undefined, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/lembretes/useConsultas', () => ({ useConsultas: () => ({ proxima: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: null, perdaNaoIntencional: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useSequencia', () => ({ useSequencia: () => ({ sequencia: 0, marco: null, dispensarMarco: jest.fn() }) }));
jest.mock('@core/lembretes/useAvisos', () => ({ useAvisos: () => ({ precisa: false, ativar: jest.fn(), adiar: jest.fn(), avaliar: jest.fn() }) }));
jest.mock('@core/cardio/lembretesCardio', () => ({ sincronizarLembretesMedicacao: async () => {} }));
jest.mock('@core/lembretes/preferencias', () => ({ renovarAvisosDiarios: async () => {} }));
jest.mock('@core/bemestar/useConquistas', () => ({ useConquistas: () => ({ proxima: null, dispensar: jest.fn(), avaliar: async () => 0 }) }));

const Home = require('../../../../app/(app)/(tabs)/index').default;
const { MS_SAIDA_CONCLUIDA, MS_ATRASO_AO_VOLTAR } = require('@ui/index');

const TITULO = 'Cadastrar meus medicamentos';
const temTexto = (a: ReactTestRenderer, t: string) => a.root.findAll((n) => n.type === Text && n.props.children === t).length > 0;
/** O ItemHoje de um título, para ler o nível (a cor da bolinha). */
const nivelDe = (a: ReactTestRenderer, t: string) => a.root.findAll((n) => n.props.item?.titulo === t)[0]?.props.item.nivel;

beforeEach(() => { jest.useFakeTimers(); mockEstado.focada = true; mockEstado.ativas = 0; mockEstado.recargas = 0; mockFoco.length = 0; });
afterEach(() => jest.useRealTimers());

it('resolvida fora da Home: ao voltar, a bolinha fica verde e o item sai na frente da pessoa', async () => {
  let a!: ReactTestRenderer;
  await act(async () => { a = create(<Home />); });
  expect(nivelDe(a, TITULO)).toBe('cinza');

  // Foi para Meus medicamentos e cadastrou um. A Home, escondida, não muda nada.
  mockEstado.focada = false; mockEstado.ativas = 1;
  await act(async () => { a.update(<Home />); });
  expect(temTexto(a, TITULO)).toBe(true);

  // Voltou: o item aparece verde, no lugar, e só sai depois da animação.
  mockEstado.focada = true;
  await act(async () => { a.update(<Home />); });
  expect(nivelDe(a, TITULO)).toBe('verde');
  await act(async () => { jest.advanceTimersByTime(MS_ATRASO_AO_VOLTAR + MS_SAIDA_CONCLUIDA + 100); });
  await act(async () => {});
  expect(temTexto(a, TITULO)).toBe(false);
});

it('voltar para a Home recarrega as pendências', async () => {
  await act(async () => { create(<Home />); });
  const antes = mockEstado.recargas;
  await act(async () => { mockFoco.forEach((cb) => cb()); });
  expect(mockEstado.recargas).toBeGreaterThan(antes);
});
