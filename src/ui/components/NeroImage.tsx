import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

export type NeroVariant = 'base' | 'rastreando' | 'cardio' | 'bem_estar' | 'minha_saude';

// Provisório: até o PNG transparente do mascote chegar, usamos o símbolo da logo em todas as variantes.
const simbolo = require('../../../assets/images/nero/simbolo-nero.png');
const fontes: Record<NeroVariant, number> = {
  base: simbolo,
  rastreando: simbolo,
  cardio: simbolo,
  bem_estar: simbolo,
  minha_saude: simbolo,
};

interface Props { variant?: NeroVariant; size?: number; style?: StyleProp<ImageStyle>; }

export function NeroImage({ variant = 'base', size = 96, style }: Props) {
  return (
    <Image
      source={fontes[variant]}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessibilityLabel="Nero, mascote do aplicativo"
    />
  );
}
