/** Sessão de MRPA em andamento para a folha Anotar: só a consulta da sessão, com o estado de carregamento. */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockResolver: ((v: unknown) => void) | null = null;
let mockFalhar: ((e: unknown) => void) | null = null;
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } } }) }));
jest.mock('../sessoesMrpa', () => ({
  sessaoAtiva: jest.fn(() => new Promise((r, f) => { mockResolver = r; mockFalhar = f; })),
}));

const { useSessaoMrpaAtiva } = require('../useSessaoMrpaAtiva');
const { sessaoAtiva } = require('../sessoesMrpa');

let visto: { sessao: unknown; carregando: boolean } | null = null;
function Sonda() { visto = useSessaoMrpaAtiva(); return null; }

it('começa carregando e entrega a sessão ativa do usuário', async () => {
  await act(async () => { create(<Sonda />); });
  expect(visto).toEqual({ sessao: null, carregando: true });
  expect(sessaoAtiva).toHaveBeenCalledWith('u1');
  await act(async () => { mockResolver!({ id: 's1' }); });
  expect(visto).toEqual({ sessao: { id: 's1' }, carregando: false });
});

it('se a consulta falha, para de carregar e fica sem sessão', async () => {
  await act(async () => { create(<Sonda />); });
  await act(async () => { mockFalhar!(new Error('rede')); });
  expect(visto).toEqual({ sessao: null, carregando: false });
});
