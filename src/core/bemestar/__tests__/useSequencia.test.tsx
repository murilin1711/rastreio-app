/**
 * Regressão do useSequencia (D-016, parte C): o marco é gravado UMA vez.
 * O hook grava e manda recarregar o perfil, que é justamente a dependência usada para decidir se
 * há marco novo — a mesma forma dos laços do Cardio e das conquistas.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';

let mockMarcos: number[] = [];
let mockMarcoNoPerfil = 0;
let mockRecargasPerfil = 0;

jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } }, carregando: false, online: true, sair: jest.fn() }) }));
jest.mock('@core/perfil/usePerfil', () => ({
  usePerfil: () => ({
    perfil: { marcoSequenciaComemorado: mockMarcoNoPerfil },
    carregando: false,
    recarregar: async () => { mockRecargasPerfil++; },
  }),
}));
jest.mock('@core/bemestar/sequencia', () => ({
  // três dias seguidos terminando hoje
  listarDiasAtivos: async () => ['2026-09-19', '2026-09-18', '2026-09-17'],
  registrarMarcoSequencia: async (_u: string, marco: number) => { mockMarcos.push(marco); mockMarcoNoPerfil = marco; },
}));
jest.mock('@core/bemestar/useAtividades', () => ({ hojeLocalISO: () => '2026-09-19' }));

const { useSequencia } = require('../useSequencia');

function Sonda() {
  const s = useSequencia();
  return <Text>{`${s.sequencia}/${s.total}/${s.marco ?? '-'}`}</Text>;
}

beforeEach(() => { mockMarcos = []; mockMarcoNoPerfil = 0; mockRecargasPerfil = 0; });

it('conta a sequência e grava o marco de 3 dias uma única vez', async () => {
  let arvore: any;
  await act(async () => { arvore = create(<Sonda />); });
  for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(mockMarcos).toEqual([3]);
  expect(arvore.toJSON().children[0]).toBe('3/3/3');
});

it('quem já comemorou o marco não grava de novo', async () => {
  mockMarcoNoPerfil = 3;
  await act(async () => { create(<Sonda />); });
  for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(mockMarcos).toEqual([]);
});
