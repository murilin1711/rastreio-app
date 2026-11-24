/** Aba Minha Saúde como lista única (spec de navegação §6.3, D-065): "O que você quer fazer?" e sem "Linha do tempo". */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';
import { existe } from '../../../testes/rotas';

(globalThis as any).mockReact = React;
const mockPush = jest.fn();
// Funções estáveis: a tela as põe nas dependências do useFocusEffect (uma nova a cada render recarregaria sem fim).
const mockRecarregar = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/minha-saude',
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { cb(); }, [cb]); },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => {}) }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/bloqueio', () => ({
  recursoBiometrico: async () => ({ disponivel: false }),
  bloqueioAtivo: async () => false,
  definirBloqueio: jest.fn(),
  pedirBiometria: jest.fn(),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, sair: jest.fn() }) }));
jest.mock('@core/cardio/examesCardio', () => ({ listarExamesCardio: async () => [] }));
jest.mock('@core/documentos/repositorio', () => ({ listar: async () => [] }));
jest.mock('@core/lembretes/central', () => ({ listarProximos: async () => [] }));
jest.mock('@core/rastreando/contexto', () => ({ montarContexto: async () => ({ exames: [] }) }));
jest.mock('@core/lembretes/useConsultas', () => ({ useConsultas: () => ({ proxima: null, carregando: false, recarregar: mockRecarregar }) }));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: [], recarregar: mockRecarregar }) }));
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: { nome: 'M', perfilInicialCompleto: true }, antecedentes: [], carregando: false, recarregar: mockRecarregar }) }));
jest.mock('@modules/conta/Creditos', () => ({ Creditos: () => null }));

const MinhaSaude = require('../../../../app/(app)/(tabs)/minha-saude/index').default;
const { ListItem } = require('@ui/components/ListItem');

/** O arquivo de tela que atende a rota (`/(app)/(tabs)/minha-saude/x` → `app/(app)/(tabs)/minha-saude/x.tsx` ou `x/index.tsx`). */

async function montar() {
  let arvore!: ReactTestRenderer;
  await act(async () => { arvore = create(<MinhaSaude />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  return arvore;
}
const titulosDeListItem = (a: ReactTestRenderer) => a.root.findAllByType(ListItem).map((n) => n.props.title);

beforeEach(() => mockPush.mockClear());

it('as ações na ordem da spec, sob "O que você quer fazer?"', async () => {
  const arvore = await montar();
  expect(titulosDeListItem(arvore)).toEqual(['Meus remédios', 'Meus exames', 'Meus documentos', 'Levar ao médico', 'Meus lembretes', 'Meu perfil', 'Antecedentes familiares', 'Fontes científicas', 'Fale com o NERO']);
  const texto = textoDe(arvore.toJSON());
  const pergunta = texto.indexOf('O que você quer fazer?');
  expect(pergunta).toBeGreaterThanOrEqual(0);
  expect(texto.indexOf('Meus remédios')).toBeGreaterThan(pergunta);
  // As três seções antigas viraram uma só.
  for (const antiga of ['Meus dados', 'Meus registros', 'Para o médico', 'Meus medicamentos']) expect(texto).not.toContain(antiga);
  // Ajuda continua depois da lista.
  expect(texto.indexOf('Ajuda')).toBeGreaterThan(texto.indexOf('Antecedentes familiares'));
  act(() => arvore.unmount());
});

it('cada ação abre a mesma tela de antes, e a tela existe', async () => {
  const arvore = await montar();
  const esperadas: [string, string][] = [
    ['Meus remédios', '/(app)/(tabs)/minha-saude/medicamentos'],
    ['Meus exames', '/(app)/(tabs)/minha-saude/exames'],
    ['Meus documentos', '/(app)/(tabs)/minha-saude/documentos'],
    ['Levar ao médico', '/(app)/(tabs)/minha-saude/relatorios'],
    ['Meus lembretes', '/(app)/(tabs)/agenda'],
    ['Meu perfil', '/(app)/(tabs)/minha-saude/perfil'],
    ['Antecedentes familiares', '/(app)/(tabs)/minha-saude/antecedentes'],
  ];
  for (const [titulo, rota] of esperadas) {
    act(() => apertar(arvore, titulo));
    expect(mockPush).toHaveBeenLastCalledWith(rota);
    expect(existe(rota)).toBe(true);
  }
  act(() => arvore.unmount());
});

it('"Linha do tempo" saiu (mora na aba Histórico)', async () => {
  const arvore = await montar();
  expect(titulosDeListItem(arvore)).not.toContain('Linha do tempo');
  expect(textoDe(arvore.toJSON())).not.toContain('Linha do tempo');
  act(() => arvore.unmount());
});

it('o círculo "Anotar" está na tela', async () => {
  const arvore = await montar();
  expect(arvore.root.findAll((n) => n.props?.accessibilityLabel === 'Anotar' && typeof n.props?.onPress === 'function')).not.toHaveLength(0);
  act(() => arvore.unmount());
});
