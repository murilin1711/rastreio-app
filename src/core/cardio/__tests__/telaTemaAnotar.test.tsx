/** Nas telas de tema (Minha pressão, Minha glicemia), "Anotar" é o primeiro botão (spec de navegação §6.5, D-065). */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useFocusEffect: () => {},
  useLocalSearchParams: () => ({}),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@core/cardio/usePressao', () => ({
  diasAtrasISO: () => '2026-01-01',
  usePressao: () => ({
    medidas: [], parametros: null, resumo7: { media: null }, resumo30: { media: null }, convidarMrpa: false,
    carregando: false, erro: null, dispensarConvite: jest.fn(), recarregar: jest.fn(),
  }),
}));
jest.mock('@core/cardio/useGlicemia', () => ({
  useGlicemia: () => ({
    medidas: [], metas: null, perfil: null, resumo7: { n: 0 }, carregando: false, erro: null, avaliar: () => null, recarregar: jest.fn(),
  }),
}));

const Pressao = require('../../../../app/(app)/coracao/pressao/index').default;
const Glicemia = require('../../../../app/(app)/coracao/glicemia/index').default;

function botoes(Tela: React.ComponentType) {
  let arvore!: ReactTestRenderer;
  act(() => { arvore = create(<Tela />); });
  const rotulos = arvore.root.findAll((n) => typeof n.props?.label === 'string' && typeof n.props?.onPress === 'function', { deep: false })
    .map((n) => ({ label: n.props.label as string, variant: n.props.variant as string | undefined, onPress: n.props.onPress as () => void }));
  return { arvore, rotulos };
}

beforeEach(() => mockPush.mockClear());

it('Minha pressão: o primeiro botão é "Anotar minha pressão"', () => {
  const { arvore, rotulos } = botoes(Pressao);
  expect(rotulos[0].label).toBe('Anotar minha pressão');
  expect(rotulos[0].variant ?? 'primary').toBe('primary');
  expect(rotulos[1]).toMatchObject({ label: 'Iniciar MRPA', variant: 'outline' });
  act(() => rotulos[0].onPress());
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/pressao/registrar');
  act(() => arvore.unmount());
});

it('Minha glicemia: o primeiro botão é "Anotar minha glicemia"', () => {
  const { arvore, rotulos } = botoes(Glicemia);
  expect(rotulos.map((r) => r.label).slice(0, 3)).toEqual(['Anotar minha glicemia', 'Meu plano', 'Relatório']);
  expect(rotulos[0].variant ?? 'primary').toBe('primary');
  act(() => rotulos[0].onPress());
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/glicemia/registrar');
  act(() => arvore.unmount());
});
