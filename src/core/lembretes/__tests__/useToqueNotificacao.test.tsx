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

const { useToqueNotificacao, rotaComData } = require('../useToqueNotificacao');

function Sonda() { useToqueNotificacao(); return null; }
const toque = (rota: unknown, id = 'n1', acao = 'expo.modules.notifications.actions.DEFAULT', date = Date.now()) =>
  ({ actionIdentifier: acao, notification: { date, request: { identifier: id, content: { data: { rota } } } } });

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

it('lembrete de remédio: a data da dose é a da entrega, não a do toque', async () => {
  mockResposta = toque('/(app)/remedios/tomar?med=m1&hora=20:00', 'n9', undefined, new Date('2026-11-23T20:00:03').getTime());
  await act(async () => { create(<Sonda />); });
  expect(mockPush).toHaveBeenCalledWith('/(app)/remedios/tomar?med=m1&hora=20:00&data=2026-11-23');
});

it('entregue às 23h, tocado depois da meia-noite: a dose continua sendo do dia da entrega', () => {
  expect(rotaComData('/(app)/remedios/tomar?med=m1&hora=23:00', new Date('2026-11-23T23:00:01').getTime()))
    .toBe('/(app)/remedios/tomar?med=m1&hora=23:00&data=2026-11-23');
});

it('rota que já traz a data (segundo lembrete) não muda', () => {
  expect(rotaComData('/(app)/remedios/tomar?med=m1&hora=23:45&data=2026-11-23', new Date('2026-11-24T00:15:00').getTime()))
    .toBe('/(app)/remedios/tomar?med=m1&hora=23:45&data=2026-11-23');
});

it('outras rotas não ganham data', () => expect(rotaComData('/(app)/bem-estar/agua', Date.now())).toBe('/(app)/bem-estar/agua'));

it('iOS entrega a data em segundos, o Android em milissegundos: os dois dão o mesmo dia', () => {
  const ms = new Date('2026-11-23T08:00:02').getTime();
  expect(rotaComData('/(app)/remedios/tomar?med=m1&hora=08:00', ms / 1000)).toBe('/(app)/remedios/tomar?med=m1&hora=08:00&data=2026-11-23');
  expect(rotaComData('/(app)/remedios/tomar?med=m1&hora=08:00', ms)).toBe('/(app)/remedios/tomar?med=m1&hora=08:00&data=2026-11-23');
});

it('sem data de entrega válida, a rota segue sem data (a tela usa hoje)', () => {
  expect(rotaComData('/(app)/remedios/tomar?med=m1&hora=08:00', NaN)).toBe('/(app)/remedios/tomar?med=m1&hora=08:00');
});
