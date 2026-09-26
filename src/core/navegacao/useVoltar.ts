import { type Href, useFocusEffect, useLocalSearchParams, useNavigation, usePathname, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect } from 'react';
import { BackHandler } from 'react-native';
import { abaDe, comVolta } from './voltarPara';

/** Abre uma tela; se ela for de outra aba, leva junto de onde a pessoa saiu (D-054). */
export function useAbrir() {
  const router = useRouter();
  const aqui = usePathname();
  return useCallback((href: Href | string) => router.push(comVolta(href as Parameters<typeof comVolta>[0], aqui) as Href), [router, aqui]);
}

/**
 * Seta de voltar. Sem `voltarPara`, desempilha como sempre. Com ele (tela aberta de outra aba), vai
 * para a origem e devolve esta aba à tela inicial, para não reaparecer aqui na próxima visita. O arrastar
 * do iOS fica desligado nessas telas, porque desempilharia para o que tinha ficado na aba, e o voltar do
 * Android segue a mesma regra da seta.
 */
export function useVoltar() {
  const router = useRouter();
  const navigation = useNavigation();
  const { voltarPara } = useLocalSearchParams<{ voltarPara?: string }>();

  const voltar = useCallback(() => {
    if (!voltarPara) { router.back(); return; }
    const pilha = navigation.getState();
    // Módulo (Rastreamentos, Coração…) abre por cima das abas e só é alcançado a partir da Home: a aba
    // de baixo volta a Início antes de reabri-lo, senão sair do módulo cairia nesta aba.
    if (abaDe(voltarPara) === null) {
      router.navigate('/(app)/(tabs)' as Href);
      router.push(voltarPara as Href);
    } else {
      router.navigate(voltarPara as Href);
    }
    if (pilha?.key && pilha.routeNames?.includes('index')) {
      // Mesmo formato de `CommonActions.reset` (o pacote do React Navigation não é dependência direta).
      navigation.dispatch({ type: 'RESET', payload: { index: 0, routes: [{ name: 'index' }] }, target: pilha.key });
    }
  }, [voltarPara, router, navigation]);

  useLayoutEffect(() => { if (voltarPara) navigation.setOptions({ gestureEnabled: false }); }, [voltarPara, navigation]);

  useFocusEffect(useCallback(() => {
    if (!voltarPara) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { voltar(); return true; });
    return () => sub.remove();
  }, [voltarPara, voltar]));

  return voltar;
}
