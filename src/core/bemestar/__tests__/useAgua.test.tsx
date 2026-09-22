/**
 * Regressão do useAgua (C-021): a comemoração da meta é diária — dispara uma vez no dia em que a
 * meta é batida e não se repete no mesmo dia, mesmo com novos registros depois.
 * Também confere que quem tem restrição hídrica não recebe meta calculada.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';

let mockRegistros: { id: string; medidoEm: string; ml: number }[] = [];
let mockComemoracoes: string[] = [];
let mockPerfil: any = { temDoencaRenal: false, temInsuficienciaCardiaca: false, aguaMetaComemoradaEm: null };

// `useAgua` importa `salvarLembretesAgua`, que arrasta a cadeia de notificações até o cliente do
// Supabase e o AsyncStorage — nativos que não existem no Jest. Sem este mock a suíte inteira
// estourava na importação e o Jest a contava como 0 testes, sem aparecer no total.
jest.mock('@core/bemestar/lembretesAgua', () => ({ salvarLembretesAgua: async () => {}, agendarLembretesAgua: async () => {} }));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/perfil/usePerfil', () => ({ usePerfil: () => ({ perfil: mockPerfil, carregando: false, recarregar: async () => {} }) }));
jest.mock('@core/bemestar/useCorpo', () => ({ useCorpo: () => ({ ultimos: { peso: { valores: { kg: 70 } } } }) }));
jest.mock('@core/bemestar/useMetas', () => ({ useMetas: () => ({ porTipo: () => null, definir: jest.fn() }) }));
jest.mock('@core/bemestar/useAtividades', () => ({ hojeLocalISO: () => '2026-09-19' }));
jest.mock('@core/bemestar/agua', () => ({
  listarAgua: async () => mockRegistros,
  registrarAgua: async (_u: string, ml: number) => { mockRegistros = [...mockRegistros, { id: `r${mockRegistros.length}`, medidoEm: '2026-09-19T10:00:00', ml }]; },
  excluirAgua: async () => {},
  marcarMetaComemorada: async (_u: string, dia: string) => { mockComemoracoes.push(dia); mockPerfil = { ...mockPerfil, aguaMetaComemoradaEm: dia }; },
}));

const { useAgua } = require('../useAgua');

let api: any;
function Sonda() { api = useAgua(); return <Text>{`${api.totalHoje}/${api.metaMl ?? '-'}/${api.comemorar}`}</Text>; }

beforeEach(() => {
  mockRegistros = [];
  mockComemoracoes = [];
  mockPerfil = { temDoencaRenal: false, temInsuficienciaCardiaca: false, aguaMetaComemoradaEm: null };
});

it('comemora ao bater a meta e não repete no mesmo dia', async () => {
  await act(async () => { create(<Sonda />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(api.metaMl).toBe(2450); // 70 kg × 35 ml
  // dois registros de 1500 ml passam da meta
  await act(async () => { await api.registrar(1500); });
  expect(api.comemorar).toBe(false);
  await act(async () => { await api.registrar(1500); });
  expect(api.comemorar).toBe(true);
  expect(mockComemoracoes).toEqual(['2026-09-19']);
  // dispensa e bebe mais: não comemora de novo hoje
  await act(async () => { api.dispensarComemoracao(); });
  await act(async () => { await api.registrar(500); });
  expect(api.comemorar).toBe(false);
  expect(mockComemoracoes).toEqual(['2026-09-19']);
}, 10000);

it('quem tem restrição hídrica não recebe meta calculada', async () => {
  mockPerfil = { ...mockPerfil, temInsuficienciaCardiaca: true };
  await act(async () => { create(<Sonda />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(api.metaMl).toBeNull();
  expect(api.temRestricao).toBe(true);
  await act(async () => { await api.registrar(3000); });
  expect(api.comemorar).toBe(false);
  expect(mockComemoracoes).toEqual([]);
}, 10000);
