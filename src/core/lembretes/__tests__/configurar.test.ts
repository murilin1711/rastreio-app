import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CANAL_LEMBRETES, configurarNotificacoes } from '../configurar';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  AndroidImportance: { DEFAULT: 3 },
}));

const handler = Notifications.setNotificationHandler as jest.Mock;
const canal = Notifications.setNotificationChannelAsync as jest.Mock;

describe('configurarNotificacoes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registra o handler de primeiro plano e o canal "lembretes" no Android', async () => {
    Platform.OS = 'android';
    await configurarNotificacoes();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(canal).toHaveBeenCalledWith(CANAL_LEMBRETES, expect.objectContaining({ name: 'Lembretes' }));
  });

  it('no iOS só registra o handler', async () => {
    Platform.OS = 'ios';
    await configurarNotificacoes();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(canal).not.toHaveBeenCalled();
  });

  it('o handler mostra a notificação com o app aberto', async () => {
    await configurarNotificacoes();
    const cfg = handler.mock.calls[0][0];
    await expect(cfg.handleNotification()).resolves.toMatchObject({ shouldShowBanner: true, shouldShowList: true });
  });

  it('não derruba o app se o canal falhar', async () => {
    Platform.OS = 'android';
    canal.mockRejectedValueOnce(new Error('x'));
    await expect(configurarNotificacoes()).resolves.toBeUndefined();
  });
});
