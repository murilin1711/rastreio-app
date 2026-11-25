/**
 * Doses de remédio em "Para fazer hoje": a dose cujo horário chegou aparece para marcar sem depender
 * da notificação; erro na carga das doses aparece com "Tentar de novo" (nunca some em silêncio).
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

(globalThis as any).mockReact = React;
const mockFoco: (() => void)[] = [];
const mockDoses = { doses: [] as any[], carregando: false, erro: null as string | null, recarregar: jest.fn(async () => {}) };
const mockAbrir = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useIsFocused: () => true,
  useFocusEffect: (cb: () => void) => { (globalThis as any).mockReact.useEffect(() => { mockFoco.push(cb); cb(); }, [cb]); },
}));
jest.mock('@core/navegacao/useVoltar', () => ({ useAbrir: () => mockAbrir, useVoltar: () => jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false }) }));
const PERFIL_COMPLETO = {
  nome: 'M', semMedicacoes: false, semAntecedentesFamiliares: true,
  dataNascimento: '1960-01-01', sexoNascimento: 'feminino', alturaCm: 160, tabagismoStatus: 'nunca', temDiabetes: false, temHipertensao: true,
};
let mockPerfil: Record<string, unknown> = PERFIL_COMPLETO;
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: mockPerfil, antecedentes: [], carregando: false, recarregar: jest.fn(), salvar: jest.fn() }) }));
jest.mock('@core/medicacoes/useMedicacoes', () => ({ useMedicacoes: () => ({ ativas: [{ id: 'm1', nome: 'Losartana', lembrar: false, horarios: [] }], recarregar: jest.fn() }) }));
jest.mock('@core/medicacoes/useDosesHoje', () => ({ useDosesHoje: () => mockDoses }));
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

let a: ReactTestRenderer;
const tela = () => textoDe(a.toJSON());
const dose = (extra: Record<string, unknown>) => ({
  medicacaoId: 'm1', data: '2026-11-23', hora: '08:00', quantidadePrevista: 1, estado: 'pendente', comAtraso: false, tomadas: [], ...extra,
});

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-23T09:00:00') });
  mockFoco.length = 0;
  mockDoses.doses = [];
  mockDoses.erro = null;
  mockDoses.carregando = false;
  mockDoses.recarregar = jest.fn(async () => {});
  mockAbrir.mockClear();
  mockPerfil = PERFIL_COMPLETO;
});
afterEach(() => {
  act(() => a?.unmount());
  jest.useRealTimers();
});

it('dose cujo horário chegou aparece com o nome do remédio e abre "Tomou?"', async () => {
  mockDoses.doses = [dose({}), dose({ hora: '20:00' })];
  await act(async () => { a = create(<Home />); });
  expect(tela()).toContain('Losartana · hoje, 23/11, às 8h');
  expect(tela()).not.toContain('Losartana · hoje, 23/11, às 20h');
  await act(async () => { apertar(a, 'Losartana · hoje, 23/11, às 8h'); });
  expect(mockAbrir).toHaveBeenCalledWith('/(app)/remedios/tomar?med=m1&hora=08:00&data=2026-11-23');
});

it('erro nas doses de hoje: mostra a mensagem e "Tentar de novo" recarrega', async () => {
  mockDoses.erro = 'Sem conexão com a internet.';
  await act(async () => { a = create(<Home />); });
  expect(tela()).toContain('Sem conexão com a internet.');
  mockDoses.recarregar.mockClear();
  await act(async () => { apertar(a, 'Tentar de novo'); });
  expect(mockDoses.recarregar).toHaveBeenCalled();
});

it('voltar para a Home recarrega as doses de hoje', async () => {
  await act(async () => { a = create(<Home />); });
  mockDoses.recarregar.mockClear();
  await act(async () => { mockFoco.forEach((cb) => cb()); });
  expect(mockDoses.recarregar).toHaveBeenCalled();
});

describe('"Nada pendente" só com as doses de hoje carregadas', () => {
  it('doses carregadas e sem nada a fazer: "Nada pendente"', async () => {
    await act(async () => { a = create(<Home />); });
    expect(tela()).toContain('Nada pendente');
  });

  it.each([
    ['com erro', { erro: 'Sem conexão com a internet.' }],
    ['carregando', { carregando: true }],
  ])('doses %s: "Nada pendente" não aparece', async (_c, estado) => {
    Object.assign(mockDoses, estado);
    await act(async () => { a = create(<Home />); });
    expect(tela()).not.toContain('Nada pendente');
  });

  it.each([
    ['com erro', { erro: 'Sem conexão com a internet.' }],
    ['carregando', { carregando: true }],
  ])('doses %s: a pendência de outra fonte continua na tela', async (_c, estado) => {
    mockPerfil = { ...PERFIL_COMPLETO, alturaCm: null };
    Object.assign(mockDoses, estado);
    await act(async () => { a = create(<Home />); });
    expect(tela()).toContain('Completar meu perfil de saúde');
    expect(tela()).not.toContain('Nada pendente');
  });
});
