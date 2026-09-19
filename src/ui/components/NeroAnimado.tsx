import React from 'react';
import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

/** Clipes do mascote (D-015): WebP animado com alpha, gerado de `docs/nero/mascote/animacoes.md`. */
export type NeroClipe = 'repouso';

const clipes: Record<NeroClipe, { fonte: number; largura: number; altura: number; loop: boolean }> = {
  repouso: { fonte: require('../../../assets/animacoes/nero/repouso.webp'), largura: 220, altura: 360, loop: true },
};

interface Props {
  clipe?: NeroClipe;
  /** Altura em pontos; a largura segue a proporção do clipe. */
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function NeroAnimado({ clipe = 'repouso', size = 96, style }: Props) {
  const c = clipes[clipe];
  return (
    <Image
      source={c.fonte}
      style={[{ width: size * (c.largura / c.altura), height: size }, style]}
      contentFit="contain"
      autoplay
      accessibilityLabel="Nero, mascote do aplicativo"
    />
  );
}
