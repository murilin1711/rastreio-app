import { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/**
 * Motor das demonstrações (D-063): um valor de 0 a 1 em `duracaoMs`, que cada demo interpola por fases.
 * Com Reduzir movimento vai direto a 1. `onTerminou` é chamado uma vez só, na primeira vez que chega ao
 * fim; `repetir` (toque na demo) roda de novo sem avisar outra vez.
 */
export function useSequencia(duracaoMs: number, onTerminou?: () => void) {
  const progresso = useRef(new Animated.Value(0)).current;
  const avisou = useRef(false);
  const aviso = useRef(onTerminou);
  aviso.current = onTerminou;
  const reduzir = useRef(false);

  const avisar = () => {
    if (avisou.current) return;
    avisou.current = true;
    aviso.current?.();
  };

  const rodar = useCallback(() => {
    progresso.stopAnimation();
    if (reduzir.current) { progresso.setValue(1); avisar(); return; }
    progresso.setValue(0);
    // `useNativeDriver: false`: o gráfico anima o traço do SVG, que o driver nativo não cobre.
    Animated.timing(progresso, { toValue: 1, duration: duracaoMs, easing: Easing.out(Easing.cubic), useNativeDriver: false })
      .start(({ finished }) => { if (finished) avisar(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duracaoMs, progresso]);

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => { reduzir.current = r; if (vivo) rodar(); })
      .catch(() => { if (vivo) rodar(); });
    return () => { vivo = false; progresso.stopAnimation(); };
  }, [rodar, progresso]);

  return { progresso, repetir: rodar };
}

/** Fatia do progresso: 0 antes de `de`, 1 depois de `ate`, linear entre os dois. */
export const fase = (p: Animated.Value, de: number, ate: number) =>
  p.interpolate({ inputRange: [0, de, ate, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
