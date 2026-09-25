/**
 * A pergunta dos avisos na hora em que o lembrete é ligado (D-043, decisão do Murilo em 25/09).
 * Sem permissão ainda: explica e pede. Negada no iOS: avisa e leva aos Ajustes. Concedida: nada.
 * "Agora não" não cala a próxima vez em que outro lembrete for ligado.
 */
import React from 'react';
import { Linking } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

let mockEstado: 'concedida' | 'perguntar' | 'negada' = 'perguntar';
const mockPedir = jest.fn(async () => true);
const mockReagendar = jest.fn(async () => {});
const mockAdiar = jest.fn();

jest.mock('@core/lembretes/permissao', () => ({ estadoPermissao: async () => mockEstado, pedirPermissaoNotificacoes: () => mockPedir() }));
jest.mock('@core/lembretes/preferencias', () => ({ reagendarTudo: () => mockReagendar() }));
jest.mock('@core/lembretes/useAvisos', () => ({ marcarAdiado: () => mockAdiar() }));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: { user: { id: 'u1' } } }) }));
jest.mock('@ui/components/ModalAtivarAvisos', () => ({ ModalAtivarAvisos: (p: object) => { (globalThis as any).mockModal = p; return null; } }));

const { usePedidoDeAvisos } = require('../usePedidoDeAvisos');
const modal = () => (globalThis as any).mockModal as { visivel: boolean; modo: string; aoAtivar: () => void; aoAdiar: () => void };

function montar() {
  const ref: { atual: ReturnType<typeof usePedidoDeAvisos> | null } = { atual: null };
  function Sonda() { ref.atual = usePedidoDeAvisos(); return ref.atual.modal; }
  return { ref, el: <Sonda /> };
}

beforeEach(() => { mockPedir.mockClear(); mockReagendar.mockClear(); mockAdiar.mockClear(); });

it('com permissão, não mostra nada e segue na hora', async () => {
  mockEstado = 'concedida';
  const { ref, el } = montar();
  await act(async () => { create(el); });
  await act(async () => { await ref.atual!.pedir(); });
  expect(modal().visivel).toBe(false);
});

it('sem permissão, a tela só segue depois que a pessoa responde', async () => {
  mockEstado = 'perguntar';
  const { ref, el } = montar();
  await act(async () => { create(el); });
  let seguiu = false;
  await act(async () => { ref.atual!.pedir().then(() => { seguiu = true; }); });
  expect(seguiu).toBe(false);
  await act(async () => { modal().aoAdiar(); });
  expect(seguiu).toBe(true);
});

it('sem permissão: explica, pede ao sistema e recria os lembretes que já existiam', async () => {
  mockEstado = 'perguntar';
  const { ref, el } = montar();
  await act(async () => { create(el); });
  await act(async () => { ref.atual!.pedir(); });
  expect(modal()).toMatchObject({ visivel: true, modo: 'pedir' });
  await act(async () => { modal().aoAtivar(); });
  expect(mockPedir).toHaveBeenCalled();
  expect(mockReagendar).toHaveBeenCalled();
  expect(modal().visivel).toBe(false);
});

it('"Agora não" fecha, silencia a Home, e o próximo lembrete ligado pergunta de novo', async () => {
  mockEstado = 'perguntar';
  const { ref, el } = montar();
  await act(async () => { create(el); });
  await act(async () => { ref.atual!.pedir(); });
  await act(async () => { modal().aoAdiar(); });
  expect(modal().visivel).toBe(false);
  expect(mockAdiar).toHaveBeenCalled();
  await act(async () => { ref.atual!.pedir(); });
  expect(modal().visivel).toBe(true);
});

it('negada no iOS: avisa e abre direto a página de notificações dos Ajustes', async () => {
  mockEstado = 'negada';
  const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const { ref, el } = montar();
  await act(async () => { create(el); });
  await act(async () => { ref.atual!.pedir(); });
  expect(modal()).toMatchObject({ visivel: true, modo: 'ajustes' });
  await act(async () => { modal().aoAtivar(); });
  expect(abrir).toHaveBeenCalledWith('app-settings:notifications');
  expect(mockPedir).not.toHaveBeenCalled();
});
