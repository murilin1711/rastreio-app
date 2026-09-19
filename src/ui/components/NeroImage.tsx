import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

export type NeroVariant = 'base' | 'rastreando' | 'cardio' | 'bem_estar' | 'minha_saude';

// Mascote Nero (PNG transparente, 18/09/2026). Uma pose só por enquanto; variantes por módulo ficam para depois.
const mascote = require('../../../assets/images/nero/mascote-nero.png');
const fontes: Record<NeroVariant, number> = {
  base: mascote,
  rastreando: mascote,
  cardio: mascote,
  bem_estar: mascote,
  minha_saude: mascote,
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
