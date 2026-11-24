import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';

const p2 = (n: number) => String(n).padStart(2, '0');

/**
 * O lembrete principal do remédio é diário e não sabe a data; a dose é a do dia em que ele foi
 * **entregue**, não a do toque (entregue às 23h e tocado depois da meia-noite continua sendo de
 * ontem). Só a tela "Tomou?" ganha `&data=`, e só quando a rota ainda não traz uma (o segundo
 * lembrete já vem com ela). O iOS manda `date` em segundos e o Android em milissegundos.
 */
export function rotaComData(rota: string, entregueEm: number): string {
  if (!rota.startsWith('/(app)/remedios/tomar') || /[?&]data=/.test(rota)) return rota;
  if (!Number.isFinite(entregueEm) || entregueEm <= 0) return rota;
  const d = new Date(entregueEm < 1e11 ? entregueEm * 1000 : entregueEm);
  return `${rota}${rota.includes('?') ? '&' : '?'}data=${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

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
    if (typeof rota === 'string' && rota.startsWith('/(app)/')) router.push(rotaComData(rota, resposta.notification.date) as Href);
  }, [resposta, navPronta, carregando, sessao, router]);
}
