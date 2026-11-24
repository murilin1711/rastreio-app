/**
 * Salvar ou interromper/reativar um remédio refaz a janela dos segundos lembretes com a lista INTEIRA
 * (o teto de 40 é de todos os remédios juntos), não só com o remédio que mudou.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';

const remedio = (id: string, nome: string) => ({
  id, nome, dose: null, horarios: [{ hora: '08:00', quantidade: 1 }], unidade: 'comprimido', doseVariavel: false,
  sePrecisar: false, horariosDesde: null, desde: null, ate: null, prescritor: null, ativa: true, lembrar: true, observacao: null,
});

let mockLista: any[] = [];
const mockSincronizar = jest.fn(async (..._a: any[]) => {});

jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } } }) }));
jest.mock('@core/cardio/lembretesCardio', () => ({
  agendarLembretesMedicacao: async () => {},
  cancelarLembretes: async () => {},
  sincronizarSegundosLembretes: (...a: any[]) => mockSincronizar(...a),
}));
jest.mock('../repositorio', () => ({
  listarMedicacoes: async () => mockLista,
  salvarMedicacao: async () => {},
  alternarAtiva: async () => {},
}));

const { useMedicacoes } = require('../useMedicacoes');

let api: any;
function Sonda() { api = useMedicacoes(); return <Text>{String(api.medicacoes.length)}</Text>; }

beforeEach(async () => {
  mockLista = [remedio('m1', 'Losartana'), remedio('m2', 'Metformina')];
  mockSincronizar.mockClear();
  await act(async () => { create(<Sonda />); });
});

it('salvar sincroniza os segundos lembretes com todos os remédios', async () => {
  const { id: _id, horariosDesde: _h, ...novo } = remedio('x', 'Losartana');
  await act(async () => { await api.salvar({ ...novo, id: 'm1' }); });
  expect(mockSincronizar).toHaveBeenCalledTimes(1);
  expect(mockSincronizar).toHaveBeenCalledWith('u1', mockLista);
});

it('interromper ou reativar também', async () => {
  await act(async () => { await api.alternarAtiva('m2', false); });
  expect(mockSincronizar).toHaveBeenCalledWith('u1', mockLista);
  expect(mockSincronizar.mock.calls[0][1]).toHaveLength(2);
});

it('falha na sincronização não derruba o salvar', async () => {
  mockSincronizar.mockImplementationOnce(async () => { throw new Error('x'); });
  const { id: _id, horariosDesde: _h, ...novo } = remedio('x', 'Losartana');
  let erro: unknown = null;
  await act(async () => { await api.salvar({ ...novo, id: 'm1' }).catch((e: unknown) => { erro = e; }); });
  expect(mockSincronizar).toHaveBeenCalled();
  expect(erro).toBeNull();
});
