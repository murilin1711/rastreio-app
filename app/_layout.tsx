import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { configurarNotificacoes } from '@core/lembretes/configurar';
import { SessaoProvider, useSessao } from '@core/sessao/SessaoProvider';
import { useBloqueio } from '@core/sessao/useBloqueio';
import { useToqueNotificacao } from '@core/lembretes/useToqueNotificacao';
import { TelaBloqueada } from '@ui/index';

SplashScreen.preventAutoHideAsync();
configurarNotificacoes();

/**
 * Cobertura opaca que se retira com um fade (D-036). Enquanto está visível ela é a tela inteira;
 * ao sair, revela o que já está montado embaixo em 260 ms, em vez de trocar de tela num frame.
 */
const MS_REVELAR = 260;

function Cobertura({ visivel, children }: { visivel: boolean; children: React.ReactNode }) {
  const [montada, setMontada] = useState(visivel);
  const opacidade = useRef(new Animated.Value(visivel ? 1 : 0)).current;

  useEffect(() => {
    if (visivel) {
      setMontada(true);
      opacidade.setValue(1);
      return;
    }
    Animated.timing(opacidade, { toValue: 0, duration: MS_REVELAR, useNativeDriver: true })
      .start(({ finished }) => { if (finished) setMontada(false); });
  }, [visivel, opacidade]);

  if (!montada) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacidade }]} pointerEvents={visivel ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}

/**
 * Biometria na frente de tudo (D-032), para quem ligou o bloqueio em Minha Saúde.
 *
 * A cobertura fica **por cima** do app, não no lugar dele (D-036). Trocar uma coisa pela outra
 * desmontava a árvore inteira: ao passar o rosto, todas as telas e todos os hooks de dados
 * montavam do zero, e a home aparecia aos pedaços — o piscar que o Murilo viu no TestFlight.
 * Coberto, o app carrega atrás da tela de bloqueio enquanto a pessoa se identifica, e o tempo do
 * Face ID deixa de ser tempo perdido. A cobertura é opaca e ocupa a tela toda, então nada do
 * prontuário aparece antes da hora.
 */
function Protegido({ children }: { children: React.ReactNode }) {
  const { sessao } = useSessao();
  const { travado, verificando, exigeSenha, desbloquear, desbloquearComSenha } = useBloqueio();
  // Enquanto lê a preferência, não mostra nada: um piscar do conteúdo aqui mostraria justamente o
  // que o bloqueio existe para esconder.
  if (verificando) return null;
  return (
    <View style={styles.raiz}>
      {children}
      <Cobertura visivel={travado}>
        <TelaBloqueada
          onTentar={desbloquear}
          exigeSenha={exigeSenha}
          onSenha={(senha) => desbloquearComSenha(sessao?.user.email ?? '', senha)}
        />
      </Cobertura>
    </View>
  );
}

const styles = StyleSheet.create({ raiz: { flex: 1 } });

/**
 * Sem sessão, a área logada deixa de existir (D-038). Quando `guard` vira falso o roteador tira as
 * telas de `(app)` e volta para `app/index.tsx`, que manda ao login — é assim que "Sair da conta" e a
 * exclusão de conta levam a pessoa para fora. Enquanto a sessão ainda carrega, a área fica aberta:
 * quem toca num lembrete com o app fechado não pode ser jogado no login antes de a sessão chegar.
 */
export function Navegacao() {
  const { sessao, carregando } = useSessao();
  useToqueNotificacao();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={carregando || !!sessao}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function Layout() {
  const [fontesCarregadas] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontesCarregadas) SplashScreen.hideAsync();
  }, [fontesCarregadas]);

  if (!fontesCarregadas) return null;

  return (
    <SessaoProvider>
      <StatusBar style="dark" />
      <Protegido>
        <Navegacao />
      </Protegido>
    </SessaoProvider>
  );
}
