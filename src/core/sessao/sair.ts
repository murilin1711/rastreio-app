import * as Notifications from 'expo-notifications';
import { supabase } from '@core/supabase/client';

/**
 * Encerra a sessão e apaga os avisos agendados no aparelho. Eles vivem no celular, não na conta: sem
 * isso, quem saiu (ou excluiu a conta) continuaria recebendo os lembretes — e os diários da D-048 não
 * acabam sozinhos. Falha ao cancelar não impede de sair.
 */
export async function sairDoAparelho(opcoes?: { scope: 'local' }): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
  await supabase.auth.signOut(opcoes);
}
