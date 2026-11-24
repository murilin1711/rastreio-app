/**
 * "Tomei remédio" (aberta pelo ＋ Anotar): marcar sem depender da notificação. Lista as doses de hoje
 * (cada uma abre "Tomou?") e os remédios "se precisar" com "Tomei agora". Erro na carga mostra
 * "Tentar de novo", nunca uma lista vazia.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';
import { existe } from '../../../testes/rotas';

(globalThis as any).mockReact = React;

const remedio = (extra: Record<string, unknown>) => ({
  id: 'm1', nome: 'Losartana', dose: '50 mg', horarios: [{ hora: '08:00', quantidade: 1 }], unidade: 'comprimido',
  doseVariavel: false, sePrecisar: false, horariosDesde: null, desde: null, ate: null, prescritor: null, ativa: true,
  lembrar: true, observacao: null, ...extra,
});
const dose = (extra: Record<string, unknown>) => ({
  medicacaoId: 'm1', data: '2026-11-23', hora: '08:00', quantidadePrevista: 1, estado: 'pendente', comAtraso: false, tomadas: [], ...extra,
});

let mockLista: any[] = [];
let mockErroLista: Error | null = null;
const mockDoses = { doses: [] as any[], carregando: false, erro: null as string | null, recarregar: jest.fn(async () => {}) };
const mockAbrir = jest.fn();
const mockFoco: (() => void)[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { mockFoco.push(cb); cb(); }, [cb]); },
}));
jest.mock('@core/navegacao/useVoltar', () => ({ useVoltar: () => jest.fn(), useAbrir: () => mockAbrir }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
jest.mock('@core/medicacoes/repositorio', () => ({
  listarMedicacoes: async () => { if (mockErroLista) throw mockErroLista; return mockLista; },
}));
jest.mock('@core/medicacoes/useDosesHoje', () => ({ useDosesHoje: () => mockDoses }));

const Hoje = require('../../../../app/(app)/remedios/hoje').default;

let arvore: ReactTestRenderer;
const tela = () => textoDe(arvore.toJSON());
const tocar = (rotulo: string) => act(async () => { apertar(arvore, rotulo); });
const abrir = async () => { await act(async () => { arvore = create(<Hoje />); }); };

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-23T09:00:00') });
  mockLista = [remedio({}), remedio({ id: 'm3', nome: 'Dipirona', dose: '500 mg', horarios: [], sePrecisar: true })];
  mockErroLista = null;
  mockDoses.doses = [dose({}), dose({ hora: '20:00' })];
  mockDoses.carregando = false;
  mockDoses.erro = null;
  mockDoses.recarregar = jest.fn(async () => {});
  mockAbrir.mockClear();
  mockFoco.length = 0;
});
afterEach(() => {
  act(() => arvore?.unmount());
  jest.useRealTimers();
});

it('mostra o título, as doses de hoje com o estado e os remédios "se precisar"', async () => {
  mockDoses.doses = [dose({ estado: 'tomou' }), dose({ hora: '20:00' })];
  await abrir();
  expect(tela()).toContain('Tomei remédio');
  expect(tela()).toContain('Doses de hoje');
  expect(tela()).toContain('Losartana · 8h');
  expect(tela()).toContain('✓ Tomou');
  expect(tela()).toContain('Losartana · 20h');
  expect(tela()).toContain('Marcar');
  expect(tela()).toContain('Se precisar');
  expect(tela()).toContain('Dipirona 500 mg');
  expect(tela()).toContain('Tomei agora');
});

it('tocar numa dose abre "Tomou?" com remédio, hora e data', async () => {
  await abrir();
  await tocar('Losartana · 20h');
  expect(mockAbrir).toHaveBeenCalledWith('/(app)/remedios/tomar?med=m1&hora=20:00&data=2026-11-23');
});

it('"Tomei agora" abre "Tomou?" sem hora (uso avulso)', async () => {
  await abrir();
  await tocar('Tomei agora');
  expect(mockAbrir).toHaveBeenCalledWith('/(app)/remedios/tomar?med=m3');
});

it('sem remédio "se precisar": não mostra a seção', async () => {
  mockLista = [remedio({})];
  await abrir();
  expect(tela()).not.toContain('Se precisar');
});

it('sem remédio nenhum: convida a cadastrar', async () => {
  mockLista = [remedio({ ativa: false })];
  mockDoses.doses = [];
  await abrir();
  expect(tela()).toContain('Nenhum remédio cadastrado.');
  await tocar('Cadastrar remédio');
  expect(mockAbrir).toHaveBeenCalledWith('/(app)/(tabs)/minha-saude/medicamentos');
  expect(existe('/(app)/(tabs)/minha-saude/medicamentos')).toBe(true);
});

it('erro nas doses de hoje: mostra o erro e "Tentar de novo", não uma lista vazia', async () => {
  mockDoses.doses = [];
  mockDoses.erro = 'Sem conexão com a internet.';
  await abrir();
  expect(tela()).toContain('Sem conexão com a internet.');
  expect(tela()).not.toContain('Nenhum remédio cadastrado.');
  expect(tela()).not.toContain('Doses de hoje');
  mockDoses.recarregar.mockClear();
  await tocar('Tentar de novo');
  expect(mockDoses.recarregar).toHaveBeenCalled();
});

it('erro ao ler os remédios: mostra "Tentar de novo" e, ao tentar, carrega a lista', async () => {
  mockErroLista = new Error('rede');
  await abrir();
  expect(tela()).toContain('Tentar de novo');
  expect(tela()).not.toContain('Nenhum remédio cadastrado.');
  mockErroLista = null;
  await tocar('Tentar de novo');
  expect(tela()).toContain('Losartana · 8h');
});

it('volta para a tela (depois de marcar) recarrega as doses', async () => {
  await abrir();
  mockDoses.recarregar.mockClear();
  await act(async () => { mockFoco.forEach((cb) => cb()); });
  expect(mockDoses.recarregar).toHaveBeenCalled();
});

it('as rotas que a tela abre existem', () => {
  expect(existe('/(app)/remedios/tomar?med=m1&hora=08:00&data=2026-11-23')).toBe(true);
  expect(existe('/(app)/remedios/hoje')).toBe(true);
});
