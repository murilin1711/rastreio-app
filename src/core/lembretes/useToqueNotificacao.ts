import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';

/**
 * Tocar numa notificação abre a tela do lembrete (D-044). A rota vai no `data` de cada notificação
 * (`agendar` em `lembretesCardio.ts`, `rastreando/lembretes.ts`), derivada de `origemDe`.
 *
 * Com o app fechado, o toque chega antes de tudo estar de pé: espera a navegação montar e a sessão
 * carregar. Sem sessão não navega — a guarda da D-038 mandaria para o login de qualquer jeito. Com a
 * biometria ligada, a tela abre por trás da cobertura, e aparece quando a pessoa se identifica.
 */
export function useToqueNotificacao() {
  const resposta = Notifications.useLastNotificationResponse();
  const router = useRouter();
  const navPronta = !!useRootNavigationState()?.key;
  const { sessao, carregando } = useSessao();
  const tratada = useRef<string | null>(null);

  useEffect(() => {
    if (!resposta || !navPronta || carregando || !sessao) return;
    const id = resposta.notification.request.identifier;
    if (tratada.current === id) return;
    tratada.current = id;
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
    if (resposta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const rota = resposta.notification.request.content.data?.rota;
    if (typeof rota === 'string' && rota.startsWith('/(app)/')) router.push(rota as Href);
  }, [resposta, navPronta, carregando, sessao, router]);
}
