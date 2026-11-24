/**
 * Resumo de adesão de um período (check-in semanal): remédios + tomadas do período → resumirAdesao.
 * Falha na carga vira `erro` (a tela mostra "Tentar de novo"), nunca lista vazia silenciosa.
 */
import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

const remedio = (id: string, extra: Record<string, unknown> = {}) => ({
  id, nome: id, dose: null, horarios: [{ hora: '08:00', quantidade: 1 }], unidade: 'comprimido', doseVariavel: false,
  sePrecisar: false, horariosDesde: null, desde: null, ate: null, prescritor: null, ativa: true, lembrar: true, observacao: null, ...extra,
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

const { useAdesao } = require('../useAdesao');

let api: any;
let arvore: ReactTestRenderer;
function Sonda({ desde, ate }: { desde: string; ate: string }) { api = useAdesao(desde, ate); return <Text>{String(api.resumos.length)}</Text>; }

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-23T09:00:00') });
  mockLista = [
    remedio('m1'),
    remedio('m2', { horarios: [], sePrecisar: true }),
    remedio('m3', { ativa: false, ate: null }), // interrompido sem data de fim: sem doses fantasmas
  ];
  mockTomadas = [
    { id: 't1', medicacaoId: 'm1', dataPrevista: '2026-11-16', horaPrevista: '08:00', quantidadePrevista: 1, tomou: true, quantidade: 1, marcadoEm: new Date('2026-11-16T08:05:00').toISOString() },
    { id: 't2', medicacaoId: 'm2', dataPrevista: null, horaPrevista: null, quantidadePrevista: null, tomou: true, quantidade: 1, marcadoEm: new Date('2026-11-18T15:00:00').toISOString() },
  ];
  mockListarTomadas.mockClear();
  mockFalhar = false;
});
afterEach(() => { act(() => arvore.unmount()); jest.useRealTimers(); });

it('busca as tomadas do período e resume por remédio', async () => {
  await act(async () => { arvore = create(<Sonda desde="2026-11-16" ate="2026-11-22" />); });
  expect(mockListarTomadas).toHaveBeenCalledWith('u1', '2026-11-16', '2026-11-22');
  expect(api.carregando).toBe(false);
  expect(api.erro).toBeNull();
  expect(api.resumos.map((r: any) => `${r.medicacaoId} ${r.tomou}/${r.previstas} usos ${r.usosSePrecisar}`)).toEqual([
    'm1 1/6 usos 0', // a dose de domingo (22) ainda pode ser marcada: pendente, fora da conta,
    'm2 0/0 usos 1',
  ]);
});

it('falha na carga vira erro, sem resumo; recarregar tenta de novo', async () => {
  mockFalhar = true;
  await act(async () => { arvore = create(<Sonda desde="2026-11-16" ate="2026-11-22" />); });
  expect(api.erro).toEqual(expect.any(String));
  expect(api.erro.length).toBeGreaterThan(0);
  expect(api.resumos).toEqual([]);
  expect(api.carregando).toBe(false);
  mockFalhar = false;
  await act(async () => { await api.recarregar(); });
  expect(api.erro).toBeNull();
  expect(api.resumos).toHaveLength(2);
});

it('trocar o período busca de novo', async () => {
  await act(async () => { arvore = create(<Sonda desde="2026-11-16" ate="2026-11-22" />); });
  await act(async () => { arvore.update(<Sonda desde="2026-11-09" ate="2026-11-15" />); });
  expect(mockListarTomadas).toHaveBeenLastCalledWith('u1', '2026-11-09', '2026-11-15');
});
