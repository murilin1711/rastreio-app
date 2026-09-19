/**
 * Regressão do useAvisos: a tela de aviso só aparece quando já existe algo a lembrar, "agora não"
 * silencia por um tempo, e conceder a permissão recria as notificações dos lembretes que já
 * existiam (eles foram gravados sem `notif:` enquanto não havia permissão).
 */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';

let mockPodePerguntar = true;
let mockPendentes = 1;
let mockAdiadoEm: string | null = null;
let mockPedidos = 0;
let mockReagendou = 0;

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async () => mockAdiadoEm,
  setItem: async (_k: string, v: string) => { mockAdiadoEm = v; },
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/lembretes/permissao', () => ({
  podePerguntar: async () => mockPodePerguntar,
  pedirPermissaoNotificacoes: async () => { mockPedidos++; return true; },
}));
jest.mock('@core/lembretes/preferencias', () => ({ reagendarTudo: async () => { mockReagendou++; } }));
jest.mock('@core/supabase/client', () => {
  const q: any = {};
  for (const m of ['from', 'select', 'eq', 'gte']) q[m] = () => q;
  q.then = (r: any) => Promise.resolve({ count: mockPendentes }).then(r);
  return { supabase: { from: () => q } };
});

const { useAvisos } = require('../useAvisos');

let api: any;
function Sonda() { api = useAvisos(); return <Text>{String(api.precisa)}</Text>; }

beforeEach(() => { mockPodePerguntar = true; mockPendentes = 1; mockAdiadoEm = null; mockPedidos = 0; mockReagendou = 0; });

const montar = async () => {
  await act(async () => { create(<Sonda />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
};

it('oferece os avisos quando já existe lembrete pendente', async () => {
  await montar();
  expect(api.precisa).toBe(true);
});

it('não oferece na tela vazia do primeiro acesso', async () => {
  mockPendentes = 0;
  await montar();
  expect(api.precisa).toBe(false);
});

it('não oferece quando o sistema não deixa mais perguntar', async () => {
  mockPodePerguntar = false;
  await montar();
  expect(api.precisa).toBe(false);
  expect(mockPedidos).toBe(0);
});

it('"agora não" silencia a oferta sem queimar a permissão', async () => {
  await montar();
  await act(async () => { await api.adiar(); });
  expect(api.precisa).toBe(false);
  expect(mockPedidos).toBe(0); // nunca chegou a perguntar ao sistema
  await montar();
  expect(api.precisa).toBe(false);
});

it('ativar pede ao sistema e recria as notificações já existentes', async () => {
  await montar();
  await act(async () => { await api.ativar(); });
  expect(mockPedidos).toBe(1);
  expect(mockReagendou).toBe(1);
});
