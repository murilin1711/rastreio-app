import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Canal Android único para todos os lembretes (o mesmo `defaultChannel` do plugin em `app.json`). */
export const CANAL_LEMBRETES = 'lembretes';

/**
 * Chamado uma vez na raiz do app. Sem handler, a notificação que chega com o app aberto não aparece;
 * sem canal, o Android 8+ descarta a notificação em silêncio.
 */
export async function configurarNotificacoes(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_LEMBRETES, {
    name: 'Lembretes',
    description: 'Exames, medidas, medicações e consultas que você pediu para lembrar.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#0F2D63',
  }).catch(() => undefined);
}
