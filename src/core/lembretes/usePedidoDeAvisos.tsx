import React, { useCallback, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useSessao } from '@core/sessao/SessaoProvider';
import { ModalAtivarAvisos } from '@ui/components/ModalAtivarAvisos';
import { estadoPermissao, pedirPermissaoNotificacoes } from './permissao';
import { reagendarTudo } from './preferencias';
import { marcarAdiado } from './useAvisos';

/**
 * Página de notificações do app nos Ajustes (iOS 16+). Valor de
 * `UIApplication.openNotificationSettingsURLString`, lido no simulador em 25/09/2026 — nem o React
 * Native nem o Expo expõem a constante. Se falhar, cai na página do app, a um toque dela.
 */
const AJUSTES_NOTIFICACOES = 'app-settings:notifications';

async function abrirAjustes() {
  if (Platform.OS === 'ios') {
    try { await Linking.openURL(AJUSTES_NOTIFICACOES); return; } catch { /* cai na página do app */ }
  }
  await Linking.openSettings().catch(() => {});
}

/**
 * A pergunta dos avisos na hora em que um lembrete é ligado (D-043). A tela renderiza `modal` e chama
 * `await pedir()` **antes** de criar o lembrete: a promessa só resolve quando a pessoa responde, então
 * quem aceita já tem o lembrete novo agendado com permissão, e a tela pode fechar depois sem levar a
 * pergunta junto.
 *
 * - sem permissão ainda → explica o que o NERO avisa e pede ao sistema; aceitou, recria os
 *   lembretes que já estavam gravados em silêncio;
 * - negada no iOS → avisa que estão desligados e leva aos Ajustes;
 * - concedida → nada.
 *
 * "Agora não" silencia só a oferta da Home (14 dias); o próximo lembrete ligado pergunta de novo.
 */
export function usePedidoDeAvisos() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [modo, setModo] = useState<'pedir' | 'ajustes' | null>(null);
  const responder = useRef<(() => void) | null>(null);
  const encerrar = () => { const r = responder.current; responder.current = null; r?.(); };

  const pedir = useCallback(async () => {
    const estado = await estadoPermissao();
    if (estado === 'concedida') return;
    await new Promise<void>((resolve) => {
      responder.current?.(); // um pedido anterior sem resposta não fica pendurado
      responder.current = resolve;
      setModo(estado === 'negada' ? 'ajustes' : 'pedir');
    });
  }, []);

  const aoAtivar = useCallback(async () => {
    const eraAjustes = modo === 'ajustes';
    setModo(null);
    try {
      if (eraAjustes) { await abrirAjustes(); return; }
      const concedida = await pedirPermissaoNotificacoes();
      if (concedida && userId) await reagendarTudo(userId).catch(() => {});
    } finally {
      encerrar();
    }
  }, [modo, userId]);

  const aoAdiar = useCallback(() => {
    setModo(null);
    marcarAdiado();
    encerrar();
  }, []);

  const modal = <ModalAtivarAvisos visivel={modo != null} modo={modo ?? 'pedir'} aoAtivar={aoAtivar} aoAdiar={aoAdiar} />;
  return { pedir, modal };
}
