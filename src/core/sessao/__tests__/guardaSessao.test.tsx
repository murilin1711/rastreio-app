/**
 * Regressão (25/09/2026): "Sair da conta" apagava a sessão e a pessoa continuava dentro do app.
 * Quem mandava para o login era só `app/index.tsx`, que roda uma vez na abertura e sai da pilha
 * com o `Redirect`. A área logada precisa sair sozinha quando a sessão acaba — vale também para a
 * exclusão de conta, que termina em logout.
 *
 * A guarda é um `Stack.Protected` no layout raiz (D-038). A primeira tentativa, um `<Redirect>`
 * dentro de `app/(app)/_layout.tsx`, entrou em loop infinito no simulador: o `Redirect` chama
 * `router.replace` num `useFocusEffect` que roda a cada renderização, e o layout continua em foco.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

let mockSessao: object | null = { user: { id: 'u1' } };
let mockCarregando = false;
const mockGuardas: boolean[] = [];
const mockRedirect = jest.fn();

jest.mock('expo-router', () => {
  const Stack = ({ children }: { children?: unknown }) => children ?? null;
  Stack.Screen = () => null;
  Stack.Protected = ({ guard, children }: { guard: boolean; children?: unknown }) => { mockGuardas.push(guard); return children ?? null; };
  return { Stack, Redirect: (p: object) => { mockRedirect(p); return null; } };
});
jest.mock('@core/sessao/SessaoProvider', () => ({
  SessaoProvider: ({ children }: { children: unknown }) => children,
  useSessao: () => ({ sessao: mockSessao, carregando: mockCarregando, online: true, sair: jest.fn() }),
}));
jest.mock('@core/sessao/useBloqueio', () => ({ useBloqueio: () => ({ travado: false, verificando: false, exigeSenha: false, desbloquear: jest.fn(), desbloquearComSenha: jest.fn() }) }));
jest.mock('@core/lembretes/configurar', () => ({ configurarNotificacoes: () => {} }));
jest.mock('@core/lembretes/useToqueNotificacao', () => ({ useToqueNotificacao: () => {} }));
jest.mock('@ui/index', () => ({ TelaBloqueada: () => null }));

const { Navegacao } = require('../../../../app/_layout');

async function guarda() {
  mockGuardas.length = 0;
  await act(async () => { create(<Navegacao />); });
  return mockGuardas[mockGuardas.length - 1];
}

beforeEach(() => mockRedirect.mockClear());

it('com sessão, a área logada fica acessível', async () => {
  mockSessao = { user: { id: 'u1' } }; mockCarregando = false;
  expect(await guarda()).toBe(true);
});

it('sem sessão (depois de sair), a área logada é fechada', async () => {
  mockSessao = null; mockCarregando = false;
  expect(await guarda()).toBe(false);
});

it('enquanto a sessão carrega, não expulsa ninguém (um toque em notificação não pode cair no login)', async () => {
  mockSessao = null; mockCarregando = true;
  expect(await guarda()).toBe(true);
});

it('a área logada não redireciona sozinha: o Redirect num layout entrava em loop', async () => {
  mockSessao = null; mockCarregando = false;
  const AppLayout = require('../../../../app/(app)/_layout').default;
  await act(async () => { create(<AppLayout />); });
  expect(mockRedirect).not.toHaveBeenCalled();
});
