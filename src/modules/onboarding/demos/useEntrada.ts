import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

/**
 * Um item que entra quando `visivel` vira verdadeiro (cartões da tela 5, notificações da tela 6).
 * `driverNativo` falso quando o valor é combinado com outra animação feita em JS (a junção do relatório):
 * o iOS recusa misturar os dois.
 */
export function useEntrada(visivel: boolean, duracaoMs = 420, driverNativo = true) {
  const v = useRef(new Animated.Value(visivel ? 1 : 0)).current;
  useEffect(() => {
    if (!visivel) { v.setValue(0); return; }
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((reduzir) => {
      if (reduzir) v.setValue(1);
      else Animated.timing(v, { toValue: 1, duration: duracaoMs, useNativeDriver: driverNativo }).start();
    });
  }, [visivel, v, duracaoMs, driverNativo]);
  return v;
}
