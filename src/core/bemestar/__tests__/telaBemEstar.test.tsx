/**
 * Regressão da tela Hábitos e bem-estar (D-016, parte B): as conquistas são gravadas UMA vez.
 * O hook avalia no foco e grava, o que re-renderiza a tela — a mesma forma do bug de recarga
 * infinita do Cardio. Também confere que quem já tem todas não dispara contagem no banco.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

let mockGravadas: string[][] = [];
let mockContagens = 0;
let mockObtidas: string[] = [];
let mockHabitos: Record<string, unknown> | null = null;
const mockPush = jest.fn();
// O jest.setup.js simplifica o useAbrir; aqui vale o de verdade, para conferir que nada leva voltarPara.
jest.unmock('@core/navegacao/useVoltar');
(globalThis as any).mockReact = React;

jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { cb(); }, [cb]); },
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/bem-estar',
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ setOptions: () => {}, getState: () => ({}), dispatch: () => {} }),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: { perfilInicialCompleto: true, semMedicacoes: true, semAntecedentesFamiliares: true }, carregando: false }) }));
jest.mock('@core/bemestar/useHabitos', () => ({ useHabitos: () => ({ habitos: mockHabitos, perdaNaoIntencional: null, parametros: null, carregando: false, recarregar: jest.fn() }) }));
jest.mock('@core/bemestar/conquistas', () => ({
  listarConquistas: async () => mockObtidas,
  contarParaConquistas: async () => {
    mockContagens++;
    return { cadastroInicial: true, medicacoesResolvidas: true, antecedentesResolvidos: true, totalAtividades: 1, totalSono: 0, totalCheckins: 0 };
  },
  gravarConquistas: async (_u: string, chaves: string[]) => { mockGravadas.push(chaves); mockObtidas = [...mockObtidas, ...chaves]; },
}));

const BemEstar = require('../../../../app/(app)/bem-estar/index').default;

beforeEach(() => { mockGravadas = []; mockContagens = 0; mockObtidas = []; mockHabitos = null; mockPush.mockClear(); });

it('grava as conquistas novas uma única vez, e só as de Bem-estar', async () => {
  // "Perfil completo" não é daqui: aparecia ao voltar da Água para quem tinha completado o perfil
  // em outra tela (relato do Murilo, 25/09). Ela sai onde o perfil é completado.
  let arvore: any;
  await act(async () => { arvore = create(<BemEstar />); });
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(mockGravadas).toEqual([['primeira_atividade']]);
  act(() => arvore.unmount());
}, 10000);

it('quem já tem todas as conquistas não dispara contagem no banco', async () => {
  mockObtidas = ['primeira_atividade', 'primeira_noite_sono', 'primeiro_checkin'];
  let arvore: any;
  await act(async () => { arvore = create(<BemEstar />); });
  for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(mockContagens).toBe(0);
  expect(mockGravadas).toEqual([]);
  act(() => arvore.unmount());
}, 10000);

async function montar() {
  let arvore!: ReactTestRenderer;
  await act(async () => { arvore = create(<BemEstar />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  return arvore;
}

it('cabeçalho "Hábitos e bem-estar", "O que você quer fazer?" antes dos números', async () => {
  mockHabitos = { movimentoMin: 90, metaMin: 150, sonoMediaMin: null, pesoKg: null, pesoVariacaoKg: null, cinturaCm: null, cinturaHaDias: null, refeicoes: 0, checkinPendente: false };
  const arvore = await montar();
  const texto = textoDe(arvore.toJSON());
  expect(texto).not.toContain('Saúde & Bem-estar');
  const titulo = texto.indexOf('Hábitos e bem-estar');
  const pergunta = texto.indexOf('O que você quer fazer?');
  const numeros = texto.indexOf('Seus últimos números');
  expect(titulo).toBeGreaterThanOrEqual(0);
  expect(pergunta).toBeGreaterThan(titulo);
  expect(texto.indexOf('Meu peso e medidas')).toBeGreaterThan(pergunta);
  expect(numeros).toBeGreaterThan(texto.indexOf('Check-in da semana'));
  // Só os cartões com valor: Movimento sim; Sono, Peso, Cintura e Alimentação não.
  expect(texto).toContain('90 de 150 min');
  for (const vazio of ['Registre uma noite', 'Registre o peso', 'Registre a cintura', 'Registre uma refeição']) expect(texto).not.toContain(vazio);
  // O texto de abertura não some: desce para o fim, depois dos números.
  expect(texto.indexOf('sem contar calorias')).toBeGreaterThan(numeros);
  act(() => arvore.unmount());
});

it('sem hábitos ainda (habitos: null), "Seus últimos números" não aparece', async () => {
  const arvore = await montar();
  const texto = textoDe(arvore.toJSON());
  expect(texto).not.toContain('Seus últimos números');
  expect(texto).not.toContain('Seus últimos 7 dias');
  expect(texto).not.toContain('Registre uma atividade');
  expect(texto).toContain('sem contar calorias');
  act(() => arvore.unmount());
});

it('não oferece mais o "Relatório de Saúde & Hábitos"', async () => {
  const arvore = await montar();
  const texto = textoDe(arvore.toJSON());
  expect(texto).not.toContain('Relatório de Saúde & Hábitos');
  expect(texto).not.toContain('Ferramentas');
  act(() => arvore.unmount());
});

it('cada ação abre a tela do tema dentro do módulo (sem voltarPara)', async () => {
  const arvore = await montar();
  act(() => apertar(arvore, 'Meu sono'));
  expect(mockPush).toHaveBeenCalledWith('/(app)/bem-estar/sono');
  act(() => apertar(arvore, 'Check-in da semana'));
  expect(mockPush).toHaveBeenLastCalledWith('/(app)/bem-estar/checkin');
  act(() => arvore.unmount());
});
