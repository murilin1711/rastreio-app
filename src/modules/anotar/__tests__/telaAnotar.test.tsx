/**
 * Folha "O que você quer anotar?" (spec §6.2): um botão por item; o de módulo empilha sobre a folha,
 * o de aba (Foto de documento) fecha a folha e leva a volta para quem abriu; a medida do MRPA só
 * aparece com uma sessão em andamento, e a grade espera essa consulta para não pular.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

(globalThis as any).mockReact = React;
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
let mockSessao: { id: string } | null = null;
let mockCarregando = false;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@core/cardio/useSessaoMrpaAtiva', () => ({ useSessaoMrpaAtiva: () => ({ sessao: mockSessao, carregando: mockCarregando }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));

const TelaAnotar = require('../../../../app/(app)/anotar').default;
const { ITENS_ANOTAR } = require('../itensAnotar');

function montar() {
  let a: any;
  act(() => { a = create(<TelaAnotar />); });
  return a;
}

/** Rótulos dos botões grandes (BotaoAcao), na ordem da tela. */
const rotulosDosItens = (a: any) =>
  a.root.findAll((n: any) => typeof n.type === 'function' && n.type.name === 'BotaoAcao').map((n: any) => n.props.rotulo);

beforeEach(() => { mockPush.mockClear(); mockBack.mockClear(); mockParams = {}; mockSessao = null; mockCarregando = false; });

it('título "O que você quer anotar?" e um botão por item, na ordem de ITENS_ANOTAR', () => {
  const a = montar();
  expect(textoDe(a.toJSON())).toContain('O que você quer anotar?');
  expect(rotulosDosItens(a)).toEqual(ITENS_ANOTAR.map((i: { rotulo: string }) => i.rotulo));
});

it('"Fechar" fecha a folha', () => {
  const a = montar();
  apertar(a, 'Fechar');
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockPush).not.toHaveBeenCalled();
});

it('Pressão abre o registro empilhado sobre a folha', () => {
  const a = montar();
  apertar(a, 'Pressão');
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/pressao/registrar');
});

it('Foto de documento fecha a folha e abre com a volta para a origem', () => {
  mockParams = { origem: '/historico' };
  const a = montar();
  apertar(a, 'Foto de documento');
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/(tabs)/minha-saude/documentos/novo', params: { voltarPara: '/historico' } });
});

it('sem origem, a volta da Foto de documento é para o Início', () => {
  const a = montar();
  apertar(a, 'Foto de documento');
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/(tabs)/minha-saude/documentos/novo', params: { voltarPara: '/' } });
});

it('sem MRPA em andamento, não mostra "Medida do MRPA de agora"', () => {
  const a = montar();
  expect(textoDe(a.toJSON())).not.toContain('Medida do MRPA de agora');
});

it('com MRPA em andamento, o botão aparece no topo e abre a sessão', () => {
  mockSessao = { id: 's1' };
  const a = montar();
  const texto = textoDe(a.toJSON());
  expect(texto.indexOf('Medida do MRPA de agora')).toBeGreaterThan(-1);
  expect(texto.indexOf('Medida do MRPA de agora')).toBeLessThan(texto.indexOf('Pressão'));
  apertar(a, 'Medida do MRPA de agora');
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/mrpa/s1');
});

it('enquanto a sessão do MRPA carrega, a grade não aparece; depois vem com o botão do MRPA no topo', () => {
  mockCarregando = true;
  let a: any;
  act(() => { a = create(<TelaAnotar />); });
  expect(rotulosDosItens(a)).toEqual([]);
  expect(textoDe(a.toJSON())).toContain('O que você quer anotar?');

  mockCarregando = false;
  mockSessao = { id: 's1' };
  act(() => { a.update(<TelaAnotar />); });
  const texto = textoDe(a.toJSON());
  expect(rotulosDosItens(a)).toHaveLength(ITENS_ANOTAR.length);
  expect(texto.indexOf('Medida do MRPA de agora')).toBeGreaterThan(-1);
  expect(texto.indexOf('Medida do MRPA de agora')).toBeLessThan(texto.indexOf('Pressão'));
});
