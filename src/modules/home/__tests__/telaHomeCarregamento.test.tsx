/**
 * A abertura da Home (D-041). Cada fonte de dados chega num tempo, e as pendências entravam uma a
 * uma conforme chegavam — o Murilo viu no simulador em 25/09 e achou estranho. Agora um esqueleto
 * segura o lugar e a lista entra inteira quando todas as fontes respondem, ou aos 4 s, o que vier
 * primeiro. Depois de liberada, a lista não volta ao esqueleto (puxar para atualizar não pisca).
 */
import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

const mockFontes = { perfil: true, rastreando: true };

jest.mock('expo-router', () => ({ useIsFocused: () => true,
  useRouter: () => ({ push: jest.fn() }), useFocusEffect: () => {} }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
jest.mock('@core/perfil/usePerfil', () => ({
  usePerfil: () => ({
    // O perfil já chegou (há pendência de perfil); o que varia é o sinal de carregando.
    perfil: { nome: 'Murilo', semMedicacoes: false, semAntecedentesFamiliares: true },
    antecedentes: [], carregando: mockFontes.perfil, recarregar: jest.fn(), salvar: jest.fn(),
  }),
}));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: [], recarregar: jest.fn() }) }));
jest.mock('@core/rastreando/useRastreando', () => ({ useRastreando: () => ({ avaliacoes: {}, pendencias: [], sintomas: [], carregando: mockFontes.rastreando, recarregar: jest.fn() }) }));
jest.mock('@core/cardio/useResumoCardio', () => ({ useResumoCardio: () => ({ resumo: undefined, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/lembretes/useConsultas', () => ({ useConsultas: () => ({ proxima: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: null, perdaNaoIntencional: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/useSequencia', () => ({ useSequencia: () => ({ sequencia: 0, marco: null, dispensarMarco: jest.fn() }) }));
jest.mock('@core/lembretes/useAvisos', () => ({ useAvisos: () => ({ precisa: false, ativar: jest.fn(), adiar: jest.fn() }) }));
jest.mock('@core/cardio/lembretesCardio', () => ({ sincronizarLembretesMedicacao: async () => {} }));
jest.mock('@core/lembretes/preferencias', () => ({ renovarAvisosDiarios: async () => {} }));

const Home = require('../../../../app/(app)/(tabs)/index').default;

const temTexto = (a: ReactTestRenderer, t: string) => a.root.findAll((n) => n.type === Text && n.props.children === t).length > 0;
const temEsqueleto = (a: ReactTestRenderer) => a.root.findAll((n) => n.props.testID === 'esqueleto-pendencias').length > 0;

beforeEach(() => { jest.useFakeTimers(); mockFontes.perfil = true; mockFontes.rastreando = true; });
afterEach(() => jest.useRealTimers());

it('enquanto alguma fonte carrega, mostra o esqueleto e nenhuma pendência', async () => {
  let a!: ReactTestRenderer;
  await act(async () => { a = create(<Home />); });
  mockFontes.perfil = false; // o perfil chegou, o Rastreando não
  await act(async () => { a.update(<Home />); });
  expect(temEsqueleto(a)).toBe(true);
  expect(temTexto(a, 'Cadastrar meus medicamentos')).toBe(false);
});

it('quando todas chegam, a lista entra inteira e o esqueleto sai', async () => {
  let a!: ReactTestRenderer;
  await act(async () => { a = create(<Home />); });
  mockFontes.perfil = false; mockFontes.rastreando = false;
  await act(async () => { a.update(<Home />); });
  expect(temEsqueleto(a)).toBe(false);
  expect(temTexto(a, 'Cadastrar meus medicamentos')).toBe(true);
});

it('se uma fonte demora mais de 4 s, mostra o que já chegou', async () => {
  let a!: ReactTestRenderer;
  await act(async () => { a = create(<Home />); });
  mockFontes.perfil = false; // Rastreando segue carregando (sinal ruim)
  await act(async () => { a.update(<Home />); });
  await act(async () => { jest.advanceTimersByTime(4000); });
  expect(temEsqueleto(a)).toBe(false);
  expect(temTexto(a, 'Cadastrar meus medicamentos')).toBe(true);
});

it('puxar para atualizar não traz o esqueleto de volta', async () => {
  let a!: ReactTestRenderer;
  await act(async () => { a = create(<Home />); });
  mockFontes.perfil = false; mockFontes.rastreando = false;
  await act(async () => { a.update(<Home />); });
  mockFontes.perfil = true; mockFontes.rastreando = true; // recarregando
  await act(async () => { a.update(<Home />); });
  expect(temEsqueleto(a)).toBe(false);
  expect(temTexto(a, 'Cadastrar meus medicamentos')).toBe(true);
});
