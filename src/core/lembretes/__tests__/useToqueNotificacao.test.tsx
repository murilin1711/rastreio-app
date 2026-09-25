/**
 * O toque na notificação abre a tela do lembrete (D-044). Antes o app só abria onde estava — e
 * "Toque para preparar o relatório", no aviso da véspera da consulta, prometia o que não fazia.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

const mockPush = jest.fn();
const mockLimpar = jest.fn(async () => {});
let mockResposta: unknown = undefined;
let mockNavPronta = true;
let mockSessao: object | null = { user: { id: 'u1' } };
let mockCarregando = false;

jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  useLastNotificationResponse: () => mockResposta,
  clearLastNotificationResponseAsync: () => mockLimpar(),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRootNavigationState: () => (mockNavPronta ? { key: 'raiz' } : undefined),
}));
jest.mock('@core/sessao/SessaoProvider', () => ({ useSessao: () => ({ sessao: mockSessao, carregando: mockCarregando }) }));

const { useToqueNotificacao } = require('../useToqueNotificacao');

function Sonda() { useToqueNotificacao(); return null; }
const toque = (rota: unknown, id = 'n1', acao = 'expo.modules.notifications.actions.DEFAULT') =>
  ({ actionIdentifier: acao, notification: { request: { identifier: id, content: { data: { rota } } } } });

beforeEach(() => { mockPush.mockClear(); mockLimpar.mockClear(); mockNavPronta = true; mockSessao = { user: { id: 'u1' } }; mockCarregando = false; });

it('abre a rota que veio na notificação e limpa a resposta', async () => {
  mockResposta = toque('/(app)/(tabs)/minha-saude/medicamentos');
  await act(async () => { create(<Sonda />); });
  expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/minha-saude/medicamentos');
  expect(mockLimpar).toHaveBeenCalled();
});

it('com o app fechado, espera a sessão e a navegação ficarem prontas', async () => {
  mockResposta = toque('/(app)/coracao/glicemia/registrar');
  mockCarregando = true; mockSessao = null; mockNavPronta = false;
  let a!: ReturnType<typeof create>;
  await act(async () => { a = create(<Sonda />); });
  expect(mockPush).not.toHaveBeenCalled();
  mockCarregando = false; mockSessao = { user: { id: 'u1' } }; mockNavPronta = true;
  await act(async () => { a.update(<Sonda />); });
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/glicemia/registrar');
});

it('o mesmo toque não navega duas vezes', async () => {
  mockResposta = toque('/(app)/bem-estar/agua');
  let a!: ReturnType<typeof create>;
  await act(async () => { a = create(<Sonda />); });
  await act(async () => { a.update(<Sonda />); });
  expect(mockPush).toHaveBeenCalledTimes(1);
});

it('ignora rota fora da área logada e toque que não é o padrão', async () => {
  mockResposta = toque('https://exemplo.com', 'n2');
  await act(async () => { create(<Sonda />); });
  mockResposta = toque('/(app)/bem-estar/agua', 'n3', 'outra-acao');
  await act(async () => { create(<Sonda />); });
  expect(mockPush).not.toHaveBeenCalled();
});
