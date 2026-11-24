/** "Levar ao médico" (spec de navegação §6.4, D-065): cartões com os nomes novos e o aviso da MRPA concluída. */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

(globalThis as any).mockReact = React;
const mockPush = jest.fn();
let mockSessoes: { id: string; concluidaEm: string | null }[] = [];

// O jest.setup.js simplifica o useAbrir; aqui vale o de verdade (módulo do Coração: sem voltarPara).
jest.unmock('@core/navegacao/useVoltar');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/minha-saude/relatorios',
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ setOptions: () => {}, getState: () => ({}), dispatch: () => {} }),
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { cb(); }, [cb]); },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
jest.mock('@core/relatorios/compartilharQr', () => ({ limparExpirados: async () => {}, listarAtivos: async () => [], revogar: jest.fn() }));
jest.mock('@core/cardio/sessoesMrpa', () => ({ listarSessoes: async () => mockSessoes }));

const Relatorios = require('../../../../app/(app)/(tabs)/minha-saude/relatorios/index').default;

const existe = (rota: string) => {
  const base = path.join(__dirname, '../../../../app', rota.split('?')[0]);
  return fs.existsSync(`${base}.tsx`) || fs.existsSync(path.join(base, 'index.tsx'));
};

async function montar() {
  let arvore!: ReactTestRenderer;
  await act(async () => { arvore = create(<Relatorios />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  return arvore;
}

beforeEach(() => { mockPush.mockClear(); mockSessoes = []; });

it('cartões com os nomes novos', async () => {
  const arvore = await montar();
  const texto = textoDe(arvore.toJSON());
  const posicoes = ['Resumo completo', 'Pressão, coração e diabetes', 'Exames de prevenção', 'Hábitos e bem-estar'].map((t) => texto.indexOf(t));
  expect(posicoes.every((p) => p >= 0)).toBe(true);
  expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes);
  for (const antigo of ['Coração e diabetes', 'Rastreamentos', 'Peso, alimentação e sono']) expect(texto).not.toContain(antigo);
  act(() => arvore.unmount());
});

it('sem MRPA concluída, não há aviso', async () => {
  mockSessoes = [{ id: 'em', concluidaEm: null }];
  const arvore = await montar();
  const texto = textoDe(arvore.toJSON());
  expect(texto).not.toContain('Abrir o relatório da MRPA');
  expect(texto).not.toContain('ficam nas telas deles');
  act(() => arvore.unmount());
});

it('com MRPA concluída, o aviso leva ao relatório dela', async () => {
  mockSessoes = [{ id: 'em', concluidaEm: null }, { id: 's9', concluidaEm: '2026-11-01T10:00:00Z' }, { id: 's1', concluidaEm: '2026-05-01T10:00:00Z' }];
  const arvore = await montar();
  const texto = textoDe(arvore.toJSON());
  const aviso = texto.indexOf('O relatório da MRPA e o da glicemia ficam nas telas deles.');
  // Entre os cartões e "Vou a um médico específico".
  expect(aviso).toBeGreaterThan(texto.indexOf('Hábitos e bem-estar'));
  expect(texto.indexOf('Vou a um médico específico')).toBeGreaterThan(aviso);
  const links = arvore.root.findAll((n) => n.props?.accessibilityRole === 'link' && typeof n.props?.onPress === 'function' && typeof n.type !== 'string');
  expect(links.map((n) => n.props.accessibilityLabel)).toEqual(['Abrir o relatório da MRPA', 'Abrir o relatório da glicemia']);
  act(() => apertar(arvore, 'Abrir o relatório da MRPA'));
  expect(mockPush).toHaveBeenLastCalledWith('/(app)/coracao/mrpa/relatorio?sessao=s9');
  act(() => apertar(arvore, 'Abrir o relatório da glicemia'));
  expect(mockPush).toHaveBeenLastCalledWith('/(app)/coracao/glicemia/relatorio');
  expect(existe('/(app)/coracao/mrpa/relatorio')).toBe(true);
  expect(existe('/(app)/coracao/glicemia/relatorio')).toBe(true);
  act(() => arvore.unmount());
});

it('se a lista de sessões falhar, a tela abre sem o aviso', async () => {
  mockSessoes = null as any; // .find em null lança dentro do then → catch
  const arvore = await montar();
  expect(textoDe(arvore.toJSON())).toContain('Resumo completo');
  expect(textoDe(arvore.toJSON())).not.toContain('Abrir o relatório da MRPA');
  act(() => arvore.unmount());
});
