import React, { useEffect, useState } from 'react';
import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

/** Clipes do mascote (D-015): WebP animado com alpha, gerados de `docs/nero/mascote/animacoes.md`. */
export type NeroClipe = 'repouso' | 'acenar';

interface Clipe { fonte: number; largura: number; altura: number; loop: boolean; duracaoMs: number }

export const CLIPES: Record<NeroClipe, Clipe> = {
  repouso: { fonte: require('../../../assets/animacoes/nero/repouso.webp'), largura: 218, altura: 360, loop: true, duracaoMs: 4400 },
  acenar: { fonte: require('../../../assets/animacoes/nero/acenar.webp'), largura: 252, altura: 360, loop: false, duracaoMs: 3050 },
};

/** Largura fixa (a do clipe mais largo) para a troca de clipe não mexer no layout; `contain` centraliza. */
const PROPORCAO_MAX = Math.max(...Object.values(CLIPES).map((c) => c.largura / c.altura));

interface Props {
  /** Clipe em loop mostrado normalmente. */
  clipe?: NeroClipe;
  /** Clipe tocado uma vez ao montar; ao terminar, troca para `clipe`. */
  entrada?: NeroClipe;
  /** Altura em pontos. */
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/** Devolve qual clipe deve estar na tela: `entrada` até o fim da duração dela, depois `clipe`. */
export function useClipeAtual(clipe: NeroClipe, entrada?: NeroClipe): NeroClipe {
  const [atual, setAtual] = useState<NeroClipe>(entrada ?? clipe);
  useEffect(() => {
    if (!entrada) { setAtual(clipe); return; }
    setAtual(entrada);
    const t = setTimeout(() => setAtual(clipe), CLIPES[entrada].duracaoMs);
    return () => clearTimeout(t);
  }, [clipe, entrada]);
  return atual;
}

export function NeroAnimado({ clipe = 'repouso', entrada, size = 96, style }: Props) {
  const atual = useClipeAtual(clipe, entrada);
  const c = CLIPES[atual];
  return (
    <Image
      key={atual}
      source={c.fonte}
      style={[{ width: size * PROPORCAO_MAX, height: size }, style]}
      contentFit="contain"
      autoplay
      accessibilityLabel="Nero, mascote do aplicativo"
    />
  );
}
