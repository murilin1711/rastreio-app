/**
 * Check-in semanal: o quadro "Seus remédios nesta semana" da semana avaliada, entre a linha da semana
 * e as perguntas (spec §6.6). Erro na carga mostra "Tentar de novo".
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { apertar, textoDe } from '../../../testes/arvore';

const mockUseAdesao = jest.fn();
const mockAdesao = { resumos: [] as any[], carregando: false, erro: null as string | null, recarregar: jest.fn(async () => {}) };

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@core/bemestar/useCheckin', () => ({
  useCheckin: () => ({ semanaAlvo: '2026-11-16', atual: null, meses: [], salvar: jest.fn() }),
}));
jest.mock('@core/bemestar/useConquistas', () => ({
  useConquistas: () => ({ avaliar: jest.fn(async () => 0), proxima: null, dispensar: () => false }),
}));
jest.mock('@core/medicacoes/useAdesao', () => ({ useAdesao: (...a: unknown[]) => { mockUseAdesao(...a); return mockAdesao; } }));
jest.mock('@modules/fontes/FontesDaTela', () => ({ LinkFontes: () => null }));

const Checkin = require('../../../../app/(app)/bem-estar/checkin/index').default;

const losartana = {
  medicacaoId: 'm1', nome: 'Losartana', dose: '50 mg', unidade: 'comprimido', sePrecisar: false, previstas: 7, tomou: 7,
  naoTomou: 0, errado: 0, semRegistro: 0, comAtraso: 0, percentual: 100, usosSePrecisar: 0,
  doses: Array.from({ length: 7 }, (_, i) => ({ medicacaoId: 'm1', data: `2026-11-${16 + i}`, hora: '08:00', quantidadePrevista: 1, estado: 'tomou', comAtraso: false, tomadas: [] })),
};

let arvore: ReactTestRenderer;
const tela = () => textoDe(arvore.toJSON());
const abrir = async () => { await act(async () => { arvore = create(<Checkin />); }); };

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-23T09:00:00') });
  mockUseAdesao.mockClear();
  mockAdesao.resumos = [losartana];
  mockAdesao.erro = null;
  mockAdesao.recarregar = jest.fn(async () => {});
});
afterEach(() => { act(() => arvore?.unmount()); jest.useRealTimers(); });

it('mostra os remédios da semana avaliada entre a semana e as perguntas', async () => {
  await abrir();
  expect(mockUseAdesao).toHaveBeenCalledWith('2026-11-16', '2026-11-22');
  const t = tela();
  expect(t).toContain('Seus remédios nesta semana');
  expect(t).toContain('Losartana 50 mg');
  expect(t).toContain('7 de 7 ✓');
  const semana = t.indexOf('Semana de');
  const quadro = t.indexOf('Seus remédios nesta semana');
  expect(semana).toBeGreaterThanOrEqual(0);
  expect(quadro).toBeGreaterThan(semana);
  expect(t.indexOf('Salvar check-in')).toBeGreaterThan(quadro);
});

it('sem remédio na semana, o quadro não aparece', async () => {
  mockAdesao.resumos = [];
  await abrir();
  expect(tela()).not.toContain('Seus remédios nesta semana');
  expect(tela()).toContain('Salvar check-in');
});

it('erro na carga: mensagem e "Tentar de novo" recarrega', async () => {
  mockAdesao.resumos = [];
  mockAdesao.erro = 'Sem conexão com a internet.';
  await abrir();
  expect(tela()).toContain('Seus remédios nesta semana');
  expect(tela()).toContain('Sem conexão com a internet.');
  await act(async () => { apertar(arvore, 'Tentar de novo'); });
  expect(mockAdesao.recarregar).toHaveBeenCalledTimes(1);
});
