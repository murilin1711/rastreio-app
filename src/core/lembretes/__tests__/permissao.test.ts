/**
 * O pedido de permissão do sistema não pode acontecer no meio de uma ação do paciente: no iOS,
 * negar é quase definitivo (só se reverte nos Ajustes), e perder a permissão significa perder os
 * lembretes de rastreamento. Os agendadores apenas CONSULTAM o status; quem pede é a tela de aviso.
 */
const mockNotifications = { getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn() };
jest.mock('expo-notifications', () => mockNotifications);
jest.mock('@core/perfil/repositorio', () => ({ obterPerfil: async () => ({ preferenciasLembretes: { exame: true, agua: false } }) }));

const { notificacoesPermitidas, pedirPermissaoNotificacoes } = require('../permissao');

beforeEach(() => {
  mockNotifications.getPermissionsAsync.mockReset().mockResolvedValue({ status: 'granted' });
  mockNotifications.requestPermissionsAsync.mockReset().mockResolvedValue({ status: 'granted' });
});

test('agendar não dispara o pedido do sistema, só consulta', async () => {
  mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
  await notificacoesPermitidas('u1', 'exame');
  expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
  expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
});
test('sem permissão do sistema, não cria notificação nem com o tipo ligado', async () => {
  mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' });
  expect(await notificacoesPermitidas('u1', 'exame')).toBe(false);
});
test('com permissão, respeita o interruptor do tipo', async () => {
  expect(await notificacoesPermitidas('u1', 'exame')).toBe(true);
  expect(await notificacoesPermitidas('u1', 'agua')).toBe(false);
});
test('a tela de aviso é quem pede de fato ao sistema', async () => {
  mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
  expect(await pedirPermissaoNotificacoes()).toBe(true);
  expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
});
