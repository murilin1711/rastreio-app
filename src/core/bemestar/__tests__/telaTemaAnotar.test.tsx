/** Nas telas de tema de "Hábitos e bem-estar", "Anotar …" é o primeiro botão (spec de navegação §6.5, D-065). */
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
jest.mock('@core/bemestar/useCorpo', () => ({
  useCorpo: () => ({ medidas: [], ultimos: {}, parametros: null, perfil: null, carregando: false, recarregar: jest.fn(), salvarPMAV: jest.fn(), salvarObjetivo: jest.fn() }),
}));
jest.mock('@core/bemestar/useSono', () => ({
  useSono: () => ({ sonos: [], resumo: null, parametros: null, carregando: false, erro: null, excluir: jest.fn(), recarregar: jest.fn() }),
}));
jest.mock('@core/bemestar/useAtividades', () => ({
  useAtividades: () => ({ atividades: [], semana: null, trintaDias: { porTipo: [], totalMin: 0 }, parametros: null, metas: { porTipo: () => null, definir: jest.fn() }, carregando: false, erro: null, excluir: jest.fn(), recarregar: jest.fn() }),
}));
jest.mock('@core/bemestar/useAlimentacao', () => ({
  useAlimentacao: () => ({
    semana: { diasComRegistro: 0, totalRefeicoes: 0, horarioMedio: {}, variacaoMin: {}, padrao: null, porDia: [] },
    ultimos7: [], carregando: false, erro: null, excluir: jest.fn(), recarregar: jest.fn(),
  }),
}));

const Corpo = require('../../../../app/(app)/bem-estar/corpo/index').default;
const Sono = require('../../../../app/(app)/bem-estar/sono/index').default;
const Atividade = require('../../../../app/(app)/bem-estar/atividade/index').default;
const Alimentacao = require('../../../../app/(app)/bem-estar/alimentacao/index').default;

beforeEach(() => mockPush.mockClear());

it.each([
  ['Meu Corpo', Corpo, 'Anotar peso e medidas', '/(app)/bem-estar/corpo/registrar'],
  ['Meu Sono', Sono, 'Anotar noite de sono', '/(app)/bem-estar/sono/registrar'],
  ['Minhas Atividades', Atividade, 'Anotar atividade', '/(app)/bem-estar/atividade/registrar'],
  ['Minha Alimentação', Alimentacao, 'Anotar refeição', '/(app)/bem-estar/alimentacao/registrar'],
])('%s: o primeiro botão é "%s" (primário) e abre o registro', (_nome, Tela, rotulo, rota) => {
  let arvore!: ReactTestRenderer;
  act(() => { arvore = create(<Tela />); });
  const botoes = arvore.root.findAll((n) => typeof n.props?.label === 'string' && typeof n.props?.onPress === 'function', { deep: false });
  expect(botoes[0].props.label).toBe(rotulo);
  expect(botoes[0].props.variant ?? 'primary').toBe('primary');
  act(() => botoes[0].props.onPress());
  expect(mockPush).toHaveBeenCalledWith(rota);
  act(() => arvore.unmount());
});

it.each([
  ['Meu Corpo', Corpo], ['Meu Sono', Sono], ['Minhas Atividades', Atividade], ['Minha Alimentação', Alimentacao],
])('%s: cabeçalho diz "Hábitos e bem-estar"', (_nome, Tela) => {
  let arvore!: ReactTestRenderer;
  act(() => { arvore = create(<Tela />); });
  const cabecalho = arvore.root.findAll((n) => typeof n.props?.sectionLabel === 'string', { deep: false });
  expect(cabecalho[0].props.sectionLabel).toBe('Hábitos e bem-estar');
  act(() => arvore.unmount());
});
