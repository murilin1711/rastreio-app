/**
 * Doses de hoje de todos os remédios ativos com horário (com ou sem lembrete), ordenadas por hora.
 */
import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

const remedio = (id: string, horarios: { hora: string; quantidade: number }[], extra: Record<string, unknown> = {}) => ({
  id, nome: id, dose: null, horarios, unidade: 'comprimido', doseVariavel: false, sePrecisar: false, horariosDesde: null,
  desde: null, ate: null, prescritor: null, ativa: true, lembrar: true, observacao: null, ...extra,
});

let mockLista: any[] = [];
let mockTomadas: any[] = [];
let mockFalhar = false;
const mockListarTomadas = jest.fn(async (..._a: any[]) => mockTomadas);

jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } } }) }));
jest.mock('../repositorio', () => ({
  listarMedicacoes: async () => { if (mockFalhar) throw new Error('Network request failed'); return mockLista; },
  listarTomadas: (...a: any[]) => mockListarTomadas(...a),
}));

const { useDosesHoje } = require('../useDosesHoje');

let api: any;
let arvore: ReactTestRenderer;
function Sonda() { api = useDosesHoje(); return <Text>{String(api.doses.length)}</Text>; }

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-23T08:20:00') });
  mockLista = [
    remedio('m2', [{ hora: '20:00', quantidade: 1 }, { hora: '07:00', quantidade: 2 }], { lembrar: false }),
    remedio('m1', [{ hora: '08:00', quantidade: 1 }]),
    remedio('m3', [], { sePrecisar: true }),
    remedio('m4', [{ hora: '09:00', quantidade: 1 }], { ativa: false }),
  ];
  mockTomadas = [{
    id: 't1', medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1,
    tomou: true, quantidade: 1, marcadoEm: new Date('2026-11-23T08:05:00').toISOString(),
  }];
  mockListarTomadas.mockClear();
  mockFalhar = false;
});
afterEach(() => { act(() => arvore.unmount()); jest.useRealTimers(); });

it('todas as doses de hoje dos ativos com horário, ordenadas por hora e classificadas', async () => {
  await act(async () => { arvore = create(<Sonda />); });
  expect(mockListarTomadas).toHaveBeenCalledWith('u1', '2026-11-23', '2026-11-23');
  expect(api.carregando).toBe(false);
  expect(api.doses.map((d: any) => `${d.medicacaoId} ${d.hora} ${d.estado}`)).toEqual([
    'm2 07:00 pendente',
    'm1 08:00 tomou',
    'm2 20:00 pendente',
  ]);
  expect(api.doses[0].quantidadePrevista).toBe(2);
});

it('recarregar busca de novo', async () => {
  await act(async () => { arvore = create(<Sonda />); });
  mockTomadas = [];
  await act(async () => { await api.recarregar(); });
  expect(mockListarTomadas).toHaveBeenCalledTimes(2);
  expect(api.doses.find((d: any) => d.medicacaoId === 'm1').estado).toBe('pendente');
});

it('falha na carga vira `erro` (sem rejeição solta) e recarregar limpa', async () => {
  mockFalhar = true;
  await act(async () => { arvore = create(<Sonda />); });
  expect(typeof api.erro).toBe('string');
  expect(api.erro.length).toBeGreaterThan(0);
  expect(api.doses).toEqual([]);
  expect(api.carregando).toBe(false);
  mockFalhar = false;
  await act(async () => { await api.recarregar(); });
  expect(api.erro).toBeNull();
  expect(api.doses).toHaveLength(3);
});

describe('com `incluirOntem` (lista "Tomei remédio")', () => {
  function SondaOntem() { api = useDosesHoje({ incluirOntem: true }); return <Text>{String(api.doses.length)}</Text>; }

  it('busca ontem e hoje; `doses` continua só de hoje e `dosesOntem` traz as de ontem ainda sem marca', async () => {
    mockTomadas = [
      ...mockTomadas,
      { id: 't2', medicacaoId: 'm2', dataPrevista: '2026-11-22', horaPrevista: '07:00', quantidadePrevista: 2, tomou: true, quantidade: 2, marcadoEm: new Date('2026-11-22T07:10:00').toISOString() },
    ];
    await act(async () => { arvore = create(<SondaOntem />); });
    expect(mockListarTomadas).toHaveBeenCalledWith('u1', '2026-11-22', '2026-11-23');
    expect(api.doses.map((d: any) => `${d.data} ${d.medicacaoId} ${d.hora}`)).toEqual([
      '2026-11-23 m2 07:00', '2026-11-23 m1 08:00', '2026-11-23 m2 20:00',
    ]);
    expect(api.dosesOntem.map((d: any) => `${d.data} ${d.medicacaoId} ${d.hora} ${d.estado}`)).toEqual([
      '2026-11-22 m1 08:00 pendente', '2026-11-22 m2 20:00 pendente',
    ]);
  });

  it('sem a opção, `dosesOntem` vem vazia e a busca é só de hoje', async () => {
    await act(async () => { arvore = create(<Sonda />); });
    expect(api.dosesOntem).toEqual([]);
    expect(mockListarTomadas).toHaveBeenCalledWith('u1', '2026-11-23', '2026-11-23');
  });
});
