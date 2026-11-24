/** Módulo "Exames de prevenção" no molde único (spec de navegação §6.5, D-065): as ações no topo, antes dos programas. */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

const mockPush = jest.fn();
// O jest.setup.js simplifica o useAbrir; aqui vale o de verdade, para conferir a volta (voltarPara).
jest.unmock('@core/navegacao/useVoltar');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/rastreando',
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock('@core/rastreando/useRastreando', () => ({
  useRastreando: () => ({
    avaliacoes: {}, perfil: { sexoNascimento: 'masculino' }, pendencias: [], sintomas: [], exames: [],
    carregando: false, erro: null, recarregar: jest.fn(),
  }),
}));
// O cartão de programa depende de uma avaliação completa; aqui basta o nome para conferir a ordem.
jest.mock('@modules/rastreando/componentes/CardPrograma', () => {
  const { Text } = require('react-native');
  return { CardPrograma: ({ programa }: { programa: string }) => <Text>{`cartão ${programa}`}</Text> };
});

const Rastreando = require('../../../../app/(app)/rastreando/index').default;

function montar() {
  let arvore!: ReactTestRenderer;
  act(() => { arvore = create(<Rastreando />); });
  return arvore;
}

beforeEach(() => mockPush.mockClear());

it('título "Exames de prevenção" e as duas ações no topo, antes de "Para o seu perfil"', () => {
  const arvore = montar();
  const texto = textoDe(arvore.toJSON());
  expect(texto).toContain('EXAMES DE PREVENÇÃO');
  expect(texto).not.toContain('RASTREAMENTOS');
  expect(texto).not.toContain('Seus rastreamentos');
  const titulo = texto.indexOf('Exames de prevenção');
  const pergunta = texto.indexOf('O que você quer fazer?');
  const lembretes = texto.indexOf('Ver meus lembretes');
  const relatorio = texto.indexOf('Levar ao médico (relatório de prevenção)');
  const perfil = texto.indexOf('Para o seu perfil');
  expect(titulo).toBeGreaterThanOrEqual(0);
  expect(pergunta).toBeGreaterThan(titulo);
  expect(lembretes).toBeGreaterThan(pergunta);
  expect(relatorio).toBeGreaterThan(lembretes);
  expect(perfil).toBeGreaterThan(relatorio);
  // O texto de abertura não some: desce para junto do rodapé.
  expect(texto.indexOf('Rastreamento é para quem não tem sintomas')).toBeGreaterThan(perfil);
  act(() => arvore.unmount());
});

it('os botões soltos "Ver lembretes" e "Relatório de rastreamento" saíram', () => {
  const arvore = montar();
  const rotulos = arvore.root.findAll((n) => typeof n.props?.label === 'string').map((n) => n.props.label);
  expect(rotulos).not.toContain('Ver lembretes');
  expect(rotulos).not.toContain('Relatório de rastreamento');
  expect(textoDe(arvore.toJSON())).not.toContain('Relatório de rastreamento');
  act(() => arvore.unmount());
});

it('"Levar ao médico" abre a prévia de Minha Saúde com tipo, dias e a volta ao módulo', () => {
  const arvore = montar();
  act(() => apertar(arvore, 'Levar ao médico (relatório de prevenção)'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(app)/(tabs)/minha-saude/relatorios/previa',
    params: { tipo: 'oncologico', dias: '180', voltarPara: '/rastreando' },
  });
  act(() => apertar(arvore, 'Ver meus lembretes'));
  expect(mockPush).toHaveBeenLastCalledWith('/(app)/rastreando/lembretes');
  act(() => arvore.unmount());
});
